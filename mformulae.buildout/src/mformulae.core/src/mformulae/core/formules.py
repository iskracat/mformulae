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
from Acquisition import aq_inner
from Products.CMFCore.utils import getToolByName
from plone.multilingual.interfaces import ITranslationManager
from plone.directives import form
from collective.formwidget.mathjax import MathJaxFieldWidget
from collective import dexteritytextindexer
from plone.app.dexterity.behaviors.metadata import IBasic
from collective.dexteritytextindexer.utils import searchable
from plone.app.z3cform.wysiwyg import WysiwygFieldWidget

from plone.indexer import indexer
from zope.component import getUtility
from zc.relation.interfaces import ICatalog
from zope.app.intid.interfaces import IIntIds


class IFormula(form.Schema):

    directives.languageindependent('temes')
    temes = RelationList(title=u"Temes",
                         default=[],
                         value_type=RelationChoice(title=_(u"Temes a les que pertany la formula"),
                                                   source=ObjPathSourceBinder(object_provides=ITema.__identifier__)),
                         required=False,
                )

    form.widget(formula=MathJaxFieldWidget)
    directives.languageindependent('formula')
    formula = schema.Text(title=_(u"Formula matemàtica"), 
                          description=_(u"Escriu la formula matemàtica en Tex"), 
                          required=True)

    # explicacio = RichText(title=_(u"Explicació formula"), required=True)

    audio = NamedFile(title=_(u"Audio"), 
                      description=_(u"Arxiu d\'audio que conta la locucio"), 
                      required=True,)

    # dexteritytextindexer.searchable('Title')
    # dexteritytextindexer.searchable('Description')
    searchable(IBasic, 'title')
    searchable(IBasic, 'description')


class View(grok.View):
    grok.context(IFormula)
    grok.require('zope2.View')

    def getAudios(self):
        
        ltool = getToolByName(self.context, 'portal_languages')
        languages = ltool.getAvailableLanguageInformation()
        manager = ITranslationManager(self.context)
        translations = manager.get_translations()
        resultat = []
        for translation in translations.keys():
            resultat.append({'lang': languages[translation]['native'], 'obj': translations[translation]})
        return resultat


@indexer(IFormula)
def temesIndexer(obj):
    resultat = []
    temes = obj.temes
    for tema in temes:
        tema_obj = tema.to_object
        manager = ITranslationManager(tema_obj)
        translations = manager.get_translations()
        for translation in translations:
            resultat.append(translations[translation].id)
    return resultat
