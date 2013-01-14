from plone.app.testing import PloneWithPackageLayer
from plone.app.testing import IntegrationTesting
from plone.app.testing import FunctionalTesting

import mformulae.theme


MFORMULAE_THEME = PloneWithPackageLayer(
    zcml_package=mformulae.theme,
    zcml_filename='testing.zcml',
    gs_profile_id='mformulae.theme:testing',
    name="MFORMULAE_THEME")

MFORMULAE_THEME_INTEGRATION = IntegrationTesting(
    bases=(MFORMULAE_THEME, ),
    name="MFORMULAE_THEME_INTEGRATION")

MFORMULAE_THEME_FUNCTIONAL = FunctionalTesting(
    bases=(MFORMULAE_THEME, ),
    name="MFORMULAE_THEME_FUNCTIONAL")
