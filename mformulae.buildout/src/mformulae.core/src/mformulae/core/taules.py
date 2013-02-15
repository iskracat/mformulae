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
from zope import schema


class ITaula(form.Schema):

    directives.languageindependent('temes')
    temes = RelationList(title=u"Temes",
                         default=[],
                         value_type=RelationChoice(title=_(u"Temes als que pertany la taula de símbols"),
                                                   source=ObjPathSourceBinder(object_provides=ITema.__identifier__)),
                         required=False,)

    directives.languageindependent('taula')
    taula = schema.Text(title=_(u"Taula de símbols"), 
                        description=_(u"Escriu la taula de símbols en Tex"), 
                        required=True,)

    directives.languageindependent('audio')
    audio = NamedFile(title=_(u"Audio"), 
                      description=_(u"Arxiu d\'audio que conta la locució"), 
                      required=False,)


class View(grok.View):
    grok.context(ITaula)
    grok.require('zope2.View')
