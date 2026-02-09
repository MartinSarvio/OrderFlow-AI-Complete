/**
 * Tests for the unsaved changes navigation guard
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Navigation Guard', () => {
  let webBuilderHasChanges, appBuilderHasChanges, cmsHasChanges
  let pendingNavigationTarget, isNavigationGuardActive

  beforeEach(() => {
    webBuilderHasChanges = false
    appBuilderHasChanges = false
    cmsHasChanges = false
    pendingNavigationTarget = null
    isNavigationGuardActive = false
  })

  // Helper functions extracted from app.js logic
  function getUnsavedChangesBuilders() {
    const builders = []
    if (webBuilderHasChanges) builders.push({ name: 'Web Builder' })
    if (appBuilderHasChanges) builders.push({ name: 'App Builder' })
    if (cmsHasChanges) builders.push({ name: 'Flow CMS' })
    return builders
  }

  function getBuilderContext(pageId) {
    if (!pageId) return null
    if (pageId.startsWith('wb-') || pageId === 'webbuilder') return 'webbuilder'
    if (pageId.startsWith('appbuilder')) return 'appbuilder'
    if (pageId === 'flow-cms') return 'cms'
    return null
  }

  function isNavigatingWithinSameBuilder(targetPage) {
    const currentContext = getBuilderContext('webbuilder') // simulate current page
    if (!currentContext) return false
    const targetContext = getBuilderContext(targetPage)
    return currentContext === targetContext
  }

  describe('getUnsavedChangesBuilders', () => {
    it('returns empty array when no changes', () => {
      expect(getUnsavedChangesBuilders()).toEqual([])
    })

    it('detects web builder changes', () => {
      webBuilderHasChanges = true
      const builders = getUnsavedChangesBuilders()
      expect(builders).toHaveLength(1)
      expect(builders[0].name).toBe('Web Builder')
    })

    it('detects multiple builders with changes', () => {
      webBuilderHasChanges = true
      cmsHasChanges = true
      const builders = getUnsavedChangesBuilders()
      expect(builders).toHaveLength(2)
    })

    it('detects all three builders with changes', () => {
      webBuilderHasChanges = true
      appBuilderHasChanges = true
      cmsHasChanges = true
      expect(getUnsavedChangesBuilders()).toHaveLength(3)
    })
  })

  describe('getBuilderContext', () => {
    it('returns null for null input', () => {
      expect(getBuilderContext(null)).toBeNull()
    })

    it('identifies web builder pages', () => {
      expect(getBuilderContext('webbuilder')).toBe('webbuilder')
      expect(getBuilderContext('wb-header')).toBe('webbuilder')
      expect(getBuilderContext('wb-footer')).toBe('webbuilder')
    })

    it('identifies app builder pages', () => {
      expect(getBuilderContext('appbuilder')).toBe('appbuilder')
      expect(getBuilderContext('appbuilder-design')).toBe('appbuilder')
    })

    it('identifies CMS page', () => {
      expect(getBuilderContext('flow-cms')).toBe('cms')
    })

    it('returns null for non-builder pages', () => {
      expect(getBuilderContext('dashboard')).toBeNull()
      expect(getBuilderContext('analytics-overview')).toBeNull()
      expect(getBuilderContext('settings')).toBeNull()
    })
  })

  describe('isNavigatingWithinSameBuilder', () => {
    it('returns true for navigation within web builder', () => {
      expect(isNavigatingWithinSameBuilder('wb-header')).toBe(true)
    })

    it('returns false for navigation to different builder', () => {
      expect(isNavigatingWithinSameBuilder('appbuilder')).toBe(false)
    })

    it('returns false for navigation to non-builder page', () => {
      expect(isNavigatingWithinSameBuilder('dashboard')).toBe(false)
    })
  })
})
