# -*- encoding: utf-8 -*-

from plone.directives import form
from five import grok
from mformulae.core import _
from plone.app.textfield import RichText
from plone.namedfile.field import NamedFile
from z3c.relationfield.schema import RelationChoice, RelationList
from plone.formwidget.contenttree import ObjPathSourceBinder
from mformulae.core.temes import ITema
from plone.multilingualbehavior import directives


class IFormula(form.Schema):

    directives.languageindependent('temes')
    temes = RelationList(
                    title=u"Temes",
                    default=[],
                    value_type=RelationChoice(title=_(u"Temes a les que pertany la formula"),
                                              source=ObjPathSourceBinder(object_provides=ITema.__identifier__)),
                    required=False,
                )

    directives.languageindependent('formula')
    formula = RichText(title=_(u"Formula matemàtica"), description=_(u"Escriu la formula matemàtica en Tex"), required=True)

    explicacio = RichText(title=_(u"Explicació formula"), required=True)

    audio = NamedFile(title=_(u"Audio"), description=_(u"Arxiu d\'audio que conta la locucio"), required=True,)


class View(grok.View):
    grok.context(IFormula)
    grok.require('zope2.View')

