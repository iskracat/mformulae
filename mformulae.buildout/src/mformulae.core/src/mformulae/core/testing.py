from plone.app.testing import PloneWithPackageLayer
from plone.app.testing import IntegrationTesting
from plone.app.testing import FunctionalTesting

import mformulae.core


MFORMULAE_CORE = PloneWithPackageLayer(
    zcml_package=mformulae.core,
    zcml_filename='testing.zcml',
    gs_profile_id='mformulae.core:testing',
    name="MFORMULAE_CORE")

MFORMULAE_CORE_INTEGRATION = IntegrationTesting(
    bases=(MFORMULAE_CORE, ),
    name="MFORMULAE_CORE_INTEGRATION")

MFORMULAE_CORE_FUNCTIONAL = FunctionalTesting(
    bases=(MFORMULAE_CORE, ),
    name="MFORMULAE_CORE_FUNCTIONAL")
