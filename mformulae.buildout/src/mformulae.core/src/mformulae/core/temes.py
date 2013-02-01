from plone.directives import form
from five import grok
from Acquisition import aq_inner
from Products.CMFCore.utils import getToolByName
from zope.schema.interfaces import IContextSourceBinder
from zope.schema.vocabulary import SimpleVocabulary
from zope.schema.interfaces import IVocabularyFactory
from zope.interface import implements
from mformulae.core import _
from zc.relation.interfaces import ICatalog
from zope.component import getUtility
from zope.app.intid.interfaces import IIntIds


class ITema(form.Schema):
    pass


class View(grok.View):
    grok.context(ITema)
    grok.require('zope2.View')

    def getFormules(self):
        catalog = getUtility(ICatalog)
        intids = getUtility(IIntIds)
        relations = catalog.findRelations({'to_id': intids.getId(self.context)})
        resultat = []
        for relation in relations:
            resultat.append(intids.getObject(relation.from_id))
        return resultat


@grok.provider(IContextSourceBinder)
def getTemes(context):
    context = aq_inner(context)
    pc = getToolByName(context, "portal_catalog")
    coleccions = pc.searchResults(portal_type="tema")
    terms = []

    if coleccions is not None:
        for coleccio in coleccions:
            terms.append(SimpleVocabulary.createTerm(coleccio.id, str(coleccio.id), _(coleccio.id)))
    return SimpleVocabulary(terms)


class Temes(object):

    implements(IVocabularyFactory)

    def __call__(self, context):
        context = aq_inner(context)
        pc = getToolByName(context, "portal_catalog")
        temes = pc.searchResults(portal_type="tema")
        terms = []
        if temes is not None:
            for tema in temes:
                terms.append(SimpleVocabulary.createTerm(tema.id, str(tema.Title), _(tema.Title)))
        return SimpleVocabulary(terms)


TemesFactory = Temes()
