# -*- encoding: utf-8 -*-

from five import grok
from mformulae.core import _
from plone.namedfile.field import NamedFile
from z3c.relationfield.schema import RelationChoice, RelationList
from plone.formwidget.contenttree import ObjPathSourceBinder
from mformulae.core.temes import ITema
from plone.multilingualbehavior import directives
from zope import schema
from Products.CMFCore.utils import getToolByName
from plone.multilingual.interfaces import ITranslationManager
from plone.directives import form
from collective.formwidget.mathjax import MathJaxFieldWidget
from plone.app.dexterity.behaviors.metadata import IBasic
from collective.dexteritytextindexer.utils import searchable
from plone.indexer import indexer


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

    # locucio = schema.Text(title=_(u"Locució"), 
    #                       description=_(u"Escriu la locució de la fórmula"), 
    #                       required=True,)

    # audio = NamedFile(title=_(u"Audio"), 
    #                   description=_(u"Arxiu d\'audio que conta la locucio"), 
    #                   required=False,)

    searchable(IBasic, 'title')
    searchable(IBasic, 'description')


class View(grok.View):
    grok.context(IFormula)
    grok.require('zope2.View')

    # def getAudios(self):
    #     ltool = getToolByName(self.context, 'portal_languages')
    #     languages = ltool.getAvailableLanguageInformation()
    #     manager = ITranslationManager(self.context)
    #     translations = manager.get_translations()
    #     resultat = []
    #     for translation in translations.keys():
    #         resultat.append({'lang': languages[translation]['native'], 'obj': translations[translation]})
    #     return resultat

    def getTemes(self):
        ltool = getToolByName(self.context, 'portal_languages')
        languages = ltool.getAvailableLanguageInformation()
        temes = self.context.temes
        resultat = []
        for tema in temes:
            obj = tema.to_object
            manager = ITranslationManager(obj)
            translations = manager.get_translations()
            if self.context.language in translations:
                tema_idioma = translations[self.context.language]
                resultat.append({'url': tema_idioma.absolute_url, 'titol': tema_idioma.title})
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

@indexer(IFormula)
def idiomesIndexer(obj):
    llistat = []
    manager = ITranslationManager(obj)
    translations = manager.get_translations()
    for translation in translations:
        formula = translations[translation]
        for i in formula.items():
            llistat.append(i[1].Title())
    return llistat
