# Author: Eduardo Costa Martins
from src.app_util import check_args
from src.models.auth_models import User
from src import db
from flask import make_response, request, Blueprint, jsonify
from sqlalchemy import select, or_
from src.app_util import login_required, in_project, parse_change
from sys import modules

change_routes = Blueprint('change', __name__, url_prefix='/change')

"""
Takes in a project id and an item type corresponding to a changing item
Returns a list of dicts of the form:
{
    'i_id': The id of the item that was changed,
    'timestamp': When the item was changed (formatted),
    'username': The username of the person that made the change.
    'description': A parsed description of the change that was made
}
"""
@change_routes.route('/changes', methods=['GET'])
@login_required
@in_project
def get_changes(*, user, membership):

    args = request.args
    
    required = ('p_id', 'item_type', 'i_id')

    if not check_args(required, args):
        return make_response('Bad Request', 400)

    # Get the change class for the supplied item type
    ItemChangeClass = getattr(
        # Get the class for the supplied item type
        getattr(
            # Look in the item_models module (modules are objects)
            modules['src.models.item_models'],
            # The class is an attribute of a module object 
            args['item_type'], 
            # Default to NoneType object if an item with this name does not exist
            None), 
        # The __change__ attribute of a changing item gives the change class
        '__change__', 
        # Default to None if this object does not have a changelog
        None
    )

    # If the changelog does not exist
    if not ItemChangeClass:
        return make_response('Bad Request', 400)

    # Get parsed changelog
    changes = jsonify(get_changes(ItemChangeClass, args['i_id'], user.id, membership.admin))

    return make_response(changes)

def get_changes(ChangeClass, i_id, u_id, admin):

    changes = db.session.execute(select(
        # Get the change and the username of the person that made the change
        ChangeClass,
        User.username
    ).where(
        # Joining the user with the change
        User.id == ChangeClass.u_id,
        # For changes that are made to the given item
        ChangeClass.i_id == i_id,
        # The change must either have been made by the logged in user, or the user must be an admin
        or_(User.id == u_id, admin == True)
    ).order_by(
        # Newest changes first
        ChangeClass.timestamp.desc()
    )).all()

    # Convert to relevant format to be used for frontend
    processed_changes = [{
        # When the item was changed (formatted)
        'timestamp': change[0].timestamp.strftime("%Y/%m/%d, %H:%M:%S"),
        # The username of the person that made the change
        'username': change[1],
        # A parsed description of the change that was made
        'description': parse_change(change[0], change[1])
    } for change in changes]

    return processed_changes