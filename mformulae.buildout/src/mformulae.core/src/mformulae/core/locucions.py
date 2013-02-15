# -*- encoding: utf-8 -*-

from plone.directives import form
from five import grok
from mformulae.core import _
from plone.namedfile.field import NamedFile
from zope import schema


class ILocucio(form.Schema):

    title = schema.Choice(title=_(u"Idioma"),
                          vocabulary=u"plone.app.multilingual.vocabularies.AllContentLanguageVocabulary",
                          required=True,)

    locucio = schema.Text(title=_(u"Locució"), 
                          description=_(u"Escriu la locució de la fórmula"), 
                          required=True,)

    audio = NamedFile(title=_(u"Audio"), 
                      description=_(u"Arxiu d\'audio que conta la locucio"), 
                      required=False,)


class View(grok.View):
    grok.context(ILocucio)
    grok.require('zope2.View')
