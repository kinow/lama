"""
Authors: Eduardo Costa Martins
"""

import re
from jwt import decode
from jwt.exceptions import InvalidSignatureError
from functools import wraps
from src.models.auth_models import User
from src.models.project_models import Membership
from src.exc import ChangeSyntaxError
from src import db # need this in every route
from flask import current_app as app
from flask import make_response, request
from sqlalchemy.exc import OperationalError
from sqlalchemy import select
from inspect import getfullargspec

def check_args(required, args):
    """
    @param required : a list of arguments needed for the backend method
    @param args : a dictionary of arguments supplied from the frontend
    @return : True <=> all required arguments supplied /\ no extra arguments supplied
    """
    if all(arg in args for arg in required): # All arguments supplied
        # Check no extra arguments supplied
        for key in args.keys():
            if key not in required:
                return False
        return True
    return False

def check_email(email):
    """
    @param email: a string
    @return : True <==> email is a validly formatted email
    Note: Does not check if email actually exists
    Note: Whilst the input field on the frontend can check this, users can edit html
        so the backend should also check formatting
    See: https://www.rfc-editor.org/rfc/rfc3696#section-3
    See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email#validation
        Note: this pattern does not work here
    """
    return True

def check_username(username):
    """
    @param username : a string
    @return : True <=> username is valid
    A valid username is defined as a username that:
        has no leading or trailing whitespace
        is at least 5 characters long
        is no more than 32 characters long (database constraint)
    """
    return len(username.strip()) == len(username) and \
            len(username) >= 3 and \
            len(username) <= 32 # max username length according to db

def check_password(password):
    """
    @param username : a string
    @return : True <=> password is valid and complex
    A valid password is defined as a password that:
        has no leading or trailing whitespace
        is no more than 64 characters long (database constraint)
    A complex password is defined as a password that:
        is not in the list of banned common passwords (or similar to them)
        is at least 8 characters long
        fulfills at least one of the following requirements:
            contains an uppercase and lowercase character
            contains a special and non-special character
            contains a number and non-number character
            
            NB: we say at least one because enforcing many constraints actually makes passwords more predictable
    """
    banned = ["password", "password123"] # A list of common banned passwords (use env. variable?)
    caseRe = r"(?=.*[a-z]).*[A-Z]" # Uppercase and lowercase
    specialRe = r"(?=.*\W).*[\w]" # Special and non-special (note: underscore is non-special)
    numberRe = r"(?=.*[0-9]).*[^0-9]" # Number and non-number
    valid = len(password) <= 64 and len(password) == len(password.strip())
    complex = len(password) >= 8 and \
            password.lower() not in banned and \
            (re.match(caseRe, password) or \
            re.match(specialRe, password) or \
            re.match(numberRe, password))
    return valid and complex

def get_all_subclasses(cls):
    """
    @param cls : class to get subclasses of
    @return all subclasses of cls, including non-immediate subclasses
    Note: If you only need immediate subclasses then use cls.__subclasses__()
    """
    all_subclasses = set()

    for subclass in cls.__subclasses__():
        all_subclasses.add(subclass)
        all_subclasses.update(get_all_subclasses(subclass))
    
    return all_subclasses

def login_required(f):
    """
    Decorator that checks to see if the frontend is authorized (sending a valid token)
    and then passes on the corresponding user object to the decorated function
    Optionally passes user as a keyword argument
    You can enforce arguments to be keyword arguments by using * e.g.:
        def func(<positional arguments>, *, user):
    enforces user to be a keyword argument
    """
    # TODO: Check user status
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check that header for token is provided
        u_id_token = request.headers.get('u_id_token')
        if u_id_token is None:
            return make_response('1 Unauthorized', 401)
        try:
            # Decode the token
            u_id = decode(u_id_token, app.secret_key, algorithms=['HS256'])['u_id_token']
            # Fetch user with corresponding id
            user = db.session.get(User, u_id)
            # Check to see if user exists
            if not user:
                return make_response('2 Unauthorized', 401)
            # Add the found user as a keyword argument
            # Note, this means every function decorated with this must have user as an argument
            if 'user' in getfullargspec(f).kwonlyargs:
                kwargs['user'] = user
            return f(*args, **kwargs)
        except OperationalError:
            # Database error
            return make_response('Service Unavailable', 503)
        except InvalidSignatureError:
            # Token is signed incorrectly
            return make_response('3 Unauthorized', 401)
    return decorated_function

def super_admin_required(f):
    """
    Decorator that checks to see if the frontend is authorized (sending a valid token)
    with a super admin.
    Optionally passes super_admin as a keyword argument
    You can enforce arguments to be keyword arguments by using * e.g.:
        def func(<positional arguments>, *, super_admin):
    enforces user to be a keyword argument
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check that header for token is provided
        u_id_token = request.headers.get('u_id_token')
        if u_id_token is None:
            return make_response('Unauthorized', 401)
        try:
            # Decode the token
            u_id = decode(u_id_token, app.secret_key, algorithms=['HS256'])['u_id_token']
            # Fetch user with corresponding id
            # Note that querying the super_admin table equates to querying the user table and checking the type
            # So instead we query the user table (same amount of work) and then we also get to see the difference
            # between the id not existing, and a user not having permission
            user = db.session.get(User, u_id)
            # Check to see if user exists
            if not user:
                return make_response('Unauthorized', 401)
            # Check to see if user is a super_admin
            if not user.super_admin:
                return make_response('Forbidden', 403)
            # Add the found admin as a keyword argument
            # Note, this means every function decorated with this must have user as an argument
            if 'super_admin' in getfullargspec(f).kwonlyargs:
                kwargs['super_admin'] = user
            return f(*args, **kwargs)
        except OperationalError as e:
            # Database error
            print(e)
            return make_response('Service Unavailable', 503)
        except InvalidSignatureError:
            # Token is signed incorrectly
            return make_response('3 Unauthorized', 401)
    return decorated_function

def in_project(f):
    """
    Decorator that checks if the user is in a certain project. This decorator needs to be placed _below_ the login_required decorator
    Requires 'p_id' to be in either the request body, or request parameters
    Optionally passes membership and/or user as a keyword argument
    """
    # TODO: Check user status
    @wraps(f)
    def decorated_function(*args, user, **kwargs):
        if request.method == 'GET':
            p_id = request.args['p_id']
        else:
            # TODO: Change request handler to not have to use params and get rid of this first case
            if 'params' in request.json:
                p_id = request.json['params']['p_id']
            else:
                p_id = request.json['p_id']
        # Check that pId argument was provided
        if not p_id:
            return make_response('Unauthorized', 401)
        
        membership = db.session.get(Membership, {'p_id': p_id, 'u_id': user.id})

        # Check that membership exists
        if not membership:
            return make_response('Unauthorized', 401)

        # Check if function requires certain keyword only arguments
        if 'user' in getfullargspec(f).kwonlyargs:
            kwargs['user'] = user
        if 'membership' in getfullargspec(f).kwonlyargs:
            kwargs['membership'] = membership

        return f(*args, **kwargs)

    return decorated_function

def parse_change(change, username):
    from src.models.change_models import ChangeType
    match change.change_type:
        case ChangeType.create:
            return __parse_creation(change, username)
        case ChangeType.split:
            return __parse_split(change, username)
        case ChangeType.merge:
            return __parse_merge(change, username)
        case ChangeType.name:
            return __parse_name_edit(change, username)
        case ChangeType.description:
            return __parse_desc_edit(change, username)
        case ChangeType.label_theme:
            return __parse_label_theme(change, username)
        case ChangeType.theme_theme:
            return __parse_theme_theme(change, username)
        case ChangeType.labelled:
            return __parse_labelled(change, username)
        
"""
A creation string should be blank
"""
def __parse_creation(change, username):
    item_type = change.item_class_name
    description = change.description.split(' ; ')
    if len(description) > 1 or description[0] != '':
        raise ChangeSyntaxError
    return f"{username} created {item_type} {change.i_id}"

"""
A name edit string should be of the format:
"old_name ; new_name"
"""
def __parse_name_edit(change, username):
    item_type = change.item_class_name
    description = change.description.split(' ; ')
    if len(description) != 2:
        raise ChangeSyntaxError
    return f"{username} renamed {item_type} {change.i_id} from {description[0]} to {description[1]}"

"""
A description edit string should be blank
"""
def __parse_desc_edit(change, username):
    item_type = change.item_class_name
    description = change.description.split(' ; ')
    if len(description):
        raise ChangeSyntaxError
    return f"{username} changed the description of {item_type} {change.i_id}"

"""
A split string should be of the format:
"'into'|'from' ; parent_id|child_id"
"""
def __parse_split(change, username):
    description = change.description.split(' ; ')
    if len(description) != 2:
        raise ChangeSyntaxError
    return f"{username} split Artifact {change.i_id} {description[0]} Artifact {description[1]}"

"""
A merge string should be of the format:
"child_id"
"""
def __parse_merge(change, username):
    description = change.description.split(' ; ')
    if len(description) != 1:
        raise ChangeSyntaxError
    return f"{username} merged Label {change.i_id} into Label {change.description}"

"""
A label_theme string should be of the format:
"'added'|'removed' ; <comma separated label/theme ids>"
"""
def __parse_label_theme(change, username):
    item_type = change.item_class_name
    description = change.description.split(' ; ')
    if len(description) != 2:
        raise ChangeSyntaxError
    ids = description[1].split(', ')
    if ids[0].strip() == "":
        raise ChangeSyntaxError
    match description[0]:
        case 'added':
            if item_type == 'Label':
                return f"{username} added Label {change.i_id} to theme{'s' if len(ids[1]) > 1 else ''} {description[1]}"
            return f"{username} added Label{'s' if len(ids[1]) > 1 else ''} {description[1]} to theme {change.i_id}"
        case 'removed':
            if item_type == 'Label':
                return f"{username} removed Label {change.i_id} from theme{'s' if len(ids[1]) > 1 else ''} {description[1]}"
            return f"{username} removed Label{'s' if len(ids[1]) > 1 else ''} {description[1]} from theme {change.i_id}"
        case _:
            raise ChangeSyntaxError

"""
A theme_theme string should be of the format:
'sub'|'super' ; <comma separated theme ids>
"""
def __parse_theme_theme(change, username):
    description = change.description.split(' ; ')
    if len(description) != 2:
        raise ChangeSyntaxError
    ids = description[1].split(', ')
    if ids[0].strip() == "":
        raise ChangeSyntaxError
    return f"{username} made Theme {change.i_id} a {description[0]}theme of theme{'s' if len(ids[1]) > 1 else ''} {description[1]}"

"""
A labelled string should be of the format:
'label' ; label_type_name ; label_id
'edit'|'merge' ; label_type_name ; old_label_id ; new_label_id
"""
def __parse_labelled(change, username):
    description = change.description.split(' ; ')
    match description[0]:
        case 'label':
            if len(description) != 3:
                raise ChangeSyntaxError
            return f"{username} labelled Artifact {change.i_id} with Label {description[2]} of type {description[1]}"
        case 'edit':            
            if len(description) != 4:
                raise ChangeSyntaxError
            return f"{username} changed Artifact {change.i_id}'s Label of type {description[1]} from {description[2]} to {description[3]}"
        case 'merge':
            if len(description) != 4:
                raise ChangeSyntaxError
            return f"Artifact {change.i_id}'s Label of type {description[1]} changed from {description[2]} to {description[3]} as a result of a merge {username} made"
        case _:
            raise ChangeSyntaxError