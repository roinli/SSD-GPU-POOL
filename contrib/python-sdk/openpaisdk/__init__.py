from opensourceaisdk.flags import __flags__
from opensourceaisdk.io_utils import to_screen
from opensourceaisdk.defaults import get_defaults, update_default, LayeredSettings
from opensourceaisdk.cluster import ClusterList, Cluster
from opensourceaisdk.job import Job, JobStatusParser


__version__ = '0.4.00'


def in_job_container(varname: str = 'PAI_CONTAINER_ID'):
    """in_job_container check whether it is inside a job container (by checking environmental variables)


    Keyword Arguments:
        varname {str} -- the variable to test (default: {'PAI_CONTAINER_ID'})

    Returns:
        [bool] -- return True is os.environ[varname] is set
    """
    if not os.environ.get(varname, ''):
        return False
    return True
