<template>
  <div id="sidebar-view" v-click-outside="hide" :class="{'hide-bar':!value}">
    <div class="label" @click="toggleVisibility">{{ 'lifelines-webshop-sidebar-header' | i18n }}<font-awesome-icon icon="angle-double-down" class="ml-2"></font-awesome-icon></div>
    <div class="overflow-hidden">
      <div class="sidebar-width">
        <h3 class="px-4">{{ 'lifelines-webshop-sidebar-header' | i18n }}</h3>
        <ul class="list-unstyled sidebar-content p-4">
          <li class="hide-sidebar" @click="hide"><font-awesome-icon icon="angle-double-left" size="lg"></font-awesome-icon></li>
          <li>
            <facet-container
              facetId="age"
              label="Age"
              :collapsable="true"
              :collapsed="activeAgeFacetId !== 'age'"
              @facetToggle="handleAgeToggle">
                <age-facet
                facetId="age"
                :ageGroupOptions="ageGroupOptions"
                :ageAtOptions="ageAtOptions"
                v-model="selectedAgeAt" />
            </facet-container>
          </li>
          <li>
            <facet-container
              facetId="yob"
              label="Year of birth"
              :collapsable="true"
              :collapsed="activeAgeFacetId !== 'yob'"
              @facetToggle="handleAgeToggle">
                <range-facet
                facetId="yob"
                :min="1900" :max="2050"
                v-model="selectedAgeRange"/>
            </facet-container>
          </li>
          <li>
            <facet-container facetId="gender" label="Gender">
              <toggle-facet
              facetId="gender"
              :options="genderOptions"
              v-model="selectedGenderOptions" />
            </facet-container>
          </li>
          <li>
            <facet-container facetId="cohort" label="Subcohorts">
              <toggle-facet
              facetId="cohort"
              :options="subcohortOptions"
              v-model="selectedSubcohortOptions" />
            </facet-container>
          </li>
        </ul>
        <count-view class="px-4"></count-view>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import FacetContainer from '../components/facets/FacetContainer.vue'
import ToggleFacet from '../components/facets/ToggleFacet.vue'
import AgeFacet from '../components/facets/AgeFacet.vue'
import RangeFacet from '../components/facets/RangeFacet.vue'
import { mapMutations } from 'vuex'
import CountView from '@/views/CountView'
import ClickOutside from 'v-click-outside'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faAngleDoubleLeft, faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
library.add(faAngleDoubleLeft, faAngleDoubleDown)

export default Vue.extend({
  name: 'SidebarView',
  components: { FacetContainer, ToggleFacet, AgeFacet, RangeFacet, CountView, FontAwesomeIcon },
  props: {
    value: {
      type: Boolean,
      required: false,
      default: () => true
    }
  },
  data: function () {
    return {
      activeAgeFacetId: 'age',
      cachedAgeState: []
    }
  },
  methods: {
    hide () {
      this.$emit('input', false)
    },
    toggleVisibility () {
      this.$emit('input', !this.value)
    },
    handleAgeToggle (event) {
      const { collapsed, facetId } = event
      if (facetId === 'yob') {
        this.activeAgeFacetId = collapsed ? 'yob' : 'age'
      }
      if (facetId === 'age') {
        this.activeAgeFacetId = collapsed ? 'age' : 'yob'
      }
    }
  },
  watch: {
    activeAgeFacetId (active) {
      if (active === 'age') {
        const tempState = [...this.selectedAgeRange]
        this.$store.commit('removeYearOfBirthRangefilter')
        this.$store.commit('updateSelectedAgeAt', this.cachedAgeState)
        this.cachedAgeState = tempState
      }
      if (active === 'yob') {
        const tempState = Object.assign({}, this.selectedAgeAt)
        this.$store.commit('removeAgeAtFilter')
        this.$store.commit('updateYearOfBirthRangefilter', this.cachedAgeState)
        this.cachedAgeState = tempState
      }
    }
  },
  computed: {
    genderOptions () {
      return this.$store.state.genderOptions
    },
    subcohortOptions () {
      return this.$store.state.subcohortOptions
    },
    ageGroupOptions () {
      return this.$store.state.ageGroupOptions
    },
    ageAtOptions () {
      return this.$store.state.ageAtOptions
    },
    selectedGenderOptions: {
      get () {
        return this.$store.state.facetFilter.gender
      },
      set (value) {
        this.$store.commit('updateGenderFilter', value)
      }
    },
    selectedSubcohortOptions: {
      get () {
        return this.$store.state.facetFilter.subcohort
      },
      set (value) {
        this.$store.commit('updateSubcohortfilter', value)
      }
    },
    selectedAgeAt: {
      get () {
        const filter = this.$store.state.facetFilter
        return {
          ageGroupAt1A: filter.ageGroupAt1A,
          ageGroupAt2A: filter.ageGroupAt2A,
          ageGroupAt3A: filter.ageGroupAt3A
        }
      },
      set (value) {
        this.$store.commit('updateSelectedAgeAt', value)
      }
    },
    selectedAgeRange: {
      get () {
        return this.$store.state.facetFilter.yearOfBirthRange
      },
      set (value) {
        this.$store.commit('updateYearOfBirthRangefilter', value)
      }
    }
  },
  mounted () {
    this.popupItem = this.$el
  },
  directives: { clickOutside: ClickOutside.directive }
})
</script>

<style scoped lang="scss">
  @import "../scss/variables";
  #sidebar-view {
    padding: 0rem;
    position: relative;
    transition: max-width 0.3s, padding 0.3s;
    .sidebar-content {
      background-color: $light;
      position: relative;
    }
    .sidebar-width {
      min-width: 19rem;
    }
    .overflow-hidden {
    }
    .label {
      position: absolute;
      right: 0;
      padding: 0 1rem;
      line-height: 2rem;
      transform-origin: 100% 100%;
      transform: rotate(-90deg) translate(0, 1rem);
      top: 4rem;
      background-color: $light;
      display: inline-block;
      z-index: 1050;
      overflow: hidden;
      transition: height 0.3s;
      height: 0;
      white-space: nowrap;
      cursor: pointer;
    }
    &.hide-bar {
      .label{
        height: 2rem;
      }
      max-width: 1rem;
      padding: 0;
    }
    .hide-sidebar {
      position: absolute;
      top: 0;
      right: 0;
      padding: 1.25rem;
      display: inline-block;
      cursor: pointer;
      path {
        transition: fill 0.1s;
        fill: $secondary;
      }
      &:hover path {
        fill: $warning;
      }
    }
  }
</style>
