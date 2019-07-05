import actions from '@/store/actions'

// @ts-ignore
import { post } from '@molgenis/molgenis-api-client'

jest.mock('@molgenis/molgenis-api-client', () => {
  const responses: {[key:string]: Object} = {
    '/api/v2/lifelines_cart/fghij': {
      selection: '{"1":[2,3]}'
    },
    '/api/v2/lifelines_assessment': {
      items: [
        { id: 1, name: '1A' },
        { id: 2, name: '1B' }
      ]
    },
    '/api/v2/lifelines_variable?attrs=id,name,label&num=10000': {
      items: [{
        id: 2,
        name: 'ARZON',
        label: 'Suncream used'
      }, {
        id: 3,
        name: 'SAF',
        label: 'SAF'
      }]
    },
    '/api/v2/lifelines_variable?attrs=id,name,label&num=10000&start=10000': {
      items: [{
        id: 4,
        name: 'UVREFLECT',
        label: 'Reflection'
      }, {
        id: 5,
        name: 'ARCREME',
        label: 'Skin cream used'
      }]
    },
    '/api/v2/lifelines_subsection_variable?q=subsection_id==4&attrs=~id,id,subsection_id,variable_id(id,name,label,variants(id,assessment_id))&num=10000': {
      items: [{
        variable_id: {
          id: 2,
          name: 'ARZON',
          label: 'Suncream used',
          variants: [{
            id: 197,
            assessment_id: 1
          }]
        }
      }, {
        variable_id: {
          id: 3,
          name: 'SAF',
          label: 'SAF',
          variants: [{
            id: 197,
            assessment_id: 1
          }]
        }
      }, {
        variable_id: {
          id: 4,
          name: 'UVREFLECT',
          label: 'Reflection',
          variants: [{
            id: 197,
            assessment_id: 1
          }]
        }
      }, {
        variable_id: {
          id: 4,
          name: 'ARCREME',
          label: 'Skin cream used',
          variants: [{
            id: 197,
            assessment_id: 1
          }]
        }
      }]
    },
    '/api/v2/lifelines_who_when?aggs=x==variant_id&q=ll_nr.yob%3Dle%3D1970': {
      aggs: {
        matrix: [[1234], [5678]],
        xLabels: [{
          assessment_id: '1',
          id: '1'
        }, {
          assessment_id: '2',
          id: '10'
        }
        ]
      }
    },
    '/api/v2/lifelines_who_when?aggs=x==variant_id': {
      aggs: {
        matrix: [[12340], [56780]],
        xLabels: [{
          assessment_id: '1',
          id: '1'
        }, {
          assessment_id: '2',
          id: '10'
        }
        ]
      }
    }
  }
  return {
    get: (url: string) => Promise.resolve(responses[url]),
    post: jest.fn()
  }
})

describe('actions', () => {
  describe('loadAssessments', () => {
    it('loads the assessments and commits them', async (done) => {
      const commit = jest.fn()
      await actions.loadAssessments({ commit })
      expect(commit).toHaveBeenCalledWith('updateAssessments', {
        1: { id: 1, name: '1A' },
        2: { id: 2, name: '1B' }
      })
      done()
    })
  })

  describe('loadGridVariables', () => {
    it('loads variables for selected subsection', async (done) => {
      const commit = jest.fn()
      const action = actions.loadGridVariables({ state: { treeSelected: 4 }, commit })
      expect(commit).toHaveBeenCalledWith('updateGridVariables', [])
      await action
      const variant = { 'assessmentId': 1, 'assessment_id': 1, 'id': 197 }
      expect(commit).toHaveBeenCalledWith('updateGridVariables', [
        { 'id': 2, 'label': 'Suncream used', 'name': 'ARZON', 'variants': [variant] },
        { 'id': 3, 'label': 'SAF', 'name': 'SAF', 'variants': [variant] },
        { 'id': 4, 'label': 'Reflection', 'name': 'UVREFLECT', 'variants': [variant] },
        { 'id': 4, 'label': 'Skin cream used', 'name': 'ARCREME', 'variants': [variant] }
      ])
      done()
    })
    it('does not commit the grid variables if the tree selection changes during the call', async (done) => {
      const commit = jest.fn()
      const state = { treeSelected: 4 }
      const action = actions.loadGridVariables({ state, commit })
      expect(commit).toHaveBeenCalledWith('updateGridVariables', [])
      state.treeSelected = 6
      await action
      expect(commit).toHaveBeenCalledTimes(1)
      done()
    })
  })

  describe('loadVariables', () => {
    it('loads all variables', async (done) => {
      const commit = jest.fn()
      const action = actions.loadVariables({ commit })
      await action
      expect(commit).toHaveBeenCalledWith('updateVariables', {
        2: { 'id': 2, 'label': 'Suncream used', 'name': 'ARZON' },
        3: { 'id': 3, 'label': 'SAF', 'name': 'SAF' },
        4: { 'id': 4, 'label': 'Reflection', 'name': 'UVREFLECT' },
        5: { 'id': 5, 'label': 'Skin cream used', 'name': 'ARCREME' }
      })
      done()
    })
  })

  describe('loadGridData', () => {
    it('loads new variant counts if rsql is empty', async (done) => {
      const commit = jest.fn()
      const response = actions.loadGridData({ commit, getters: { rsql: '' } })
      expect(commit).toHaveBeenCalledWith('updateVariantCounts', [])
      await response
      expect(commit).toHaveBeenCalledWith('updateVariantCounts', [
        { 'count': 12340, 'variantId': 1 },
        { 'count': 56780, 'variantId': 10 }
      ])
      done()
    })

    it('loads new variant counts if rsql is nonempty', async (done) => {
      const commit = jest.fn()
      await actions.loadGridData({ commit, getters: { rsql: 'll_nr.yob=le=1970' } })
      expect(commit).toHaveBeenCalledWith('updateVariantCounts', [])
      expect(commit).toHaveBeenCalledWith('updateVariantCounts', [
        { 'count': 1234, 'variantId': 1 },
        { 'count': 5678, 'variantId': 10 }
      ])
      done()
    })

    it('does not commit the variant counts if the rsql has changed during the call', async (done) => {
      const commit = jest.fn()
      const getters = { rsql: 'll_nr.yob=le=1970' }
      const action = actions.loadGridData({ commit, getters })
      expect(commit).toHaveBeenCalledWith('updateVariantCounts', [])
      getters.rsql = ''
      await action
      expect(commit).toHaveBeenCalledTimes(1)
      done()
    })
  })

  describe('save', () => {
    it('saves grid selection', async (done) => {
      const headers = { get: jest.fn() }
      post.mockReturnValueOnce({ headers })
      headers.get.mockReturnValueOnce('https://lifelines.dev.molgenis.org/api/v1/lifelines_cart/fghij')
      await actions.save({ state: { gridSelection: { 1: [2, 3] } } })
      expect(headers.get).toHaveBeenCalledWith('Location')
      expect(post).toHaveBeenCalledWith('/api/v1/lifelines_cart', { body: '{"selection":"{\\"1\\":[2,3]}"}' })
      done()
    })
  })

  describe('load', () => {
    it('loads grid selection', async (done) => {
      const commit = jest.fn()
      await actions.load({ commit }, 'fghij')
      expect(commit).toHaveBeenCalledWith('updateGridSelection', { 1: [2, 3] })
      done()
    })
  })
})
