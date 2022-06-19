from src.app_util import check_args
from src import db # need this in every route
from flask import current_app as app
from flask import make_response, request, Blueprint, jsonify
from sqlalchemy import select, update, func
from sqlalchemy.exc import OperationalError
from src.app_util import login_required, in_project, time_from_seconds
from src.models.item_models import Label, LabelSchema, LabelType, LabelTypeSchema, \
  Labelling, LabellingSchema, Theme, ThemeSchema, Artifact, ArtifactSchema
from src.models.change_models import ChangeType

labelling_routes = Blueprint("labelling", __name__, url_prefix="/labelling")

"""
Author: B. Henkemans, V. Bogachenkova
@params user
@params membership
@returns all the labellings per label
"""
@labelling_routes.route('/by_label', methods=['GET'])
@login_required
@in_project
def get_labelling_by_label(*, user, membership):
    # Get args from request 
    args = request.args
    # What args are required
    required = ['p_id', 'label_id']

    # Check if required args are presentF
    if not check_args(required, args):
        return make_response('Bad Request', 400)
    
    # If you are an admin get all the labellings,
    # otherwise only get the user's labellings
    if membership.admin:
        labellings = db.session.execute(
            select(Labelling).where(Labelling.l_id == args['label_id'], 
            Labelling.p_id == args['p_id'])
        ).scalars().all()
    else: 
        labellings = db.session.execute(
            select(Labelling).where(Labelling.l_id == args['label_id'],
             Labelling.p_id == args['p_id'], Labelling.u_id == user.id)
        ).scalars().all()

    # Dictionary to store data: artifact id, remark and the username
    labelling_data = jsonify([{
        'a_id' : labelling.a_id,
        'remark' : labelling.remark,
        'username' : labelling.user.username
    } for labelling in labellings])

    return make_response(labelling_data)


"""
Author: B. Henkemans, V. Bogachenkova
@params user
@posts the labelling to the backend
"""
@labelling_routes.route('/create', methods=['POST'])
@login_required
@in_project
def post_labelling(*, user):
    
    args = request.json['params']
    # What args are required
    required = ['p_id', 'resultArray']

    # Check if required args are present
    if not check_args(required, args):
        return make_response('Bad Request', 400)
    
    # For every labelling, record the required data:
    # artifact id, label type id, label id, project id, remark and time
    for labelling in args['resultArray']:
        labelling_ = Labelling(
            u_id=user.id, 
            a_id=labelling['a_id'], 
            lt_id=labelling['label_type']['id'], 
            l_id=labelling['label']['id'], 
            p_id=args['p_id'], 
            remark=labelling['remark'],
            time=time_from_seconds(labelling['time'])
        )
        # Check if the labelling was added, otherwise throw and error
        try:
            __record_labelling(args['p_id'], user.id, labelling['label_type']['name'], labelling['label']['name'], labelling['a_id'])
            db.session.add(labelling_)
        except OperationalError:
            return make_response('Internal Server Error: Adding to database unsuccessful', 500)

    # Check if the labelling was commited, otherwise throw and error
    try:
        db.session.commit()
    except OperationalError:
        return make_response('Internal Server Error: Commit to database unsuccessful', 500)
    # Make a response
    return make_response()

def __record_labelling(p_id, u_id, lt_name, l_name, a_id):
    # PascalCase because it is a class
    ArtifactChange = Artifact.__change__

    change = ArtifactChange(
        p_id=p_id,
        i_id=a_id,
        u_id=u_id,
        name=a_id,
        change_type=ChangeType.labelled,
        description=f"label ; {lt_name} ; {l_name}"
    )

    db.session.add(change)