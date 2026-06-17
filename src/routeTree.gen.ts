/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

import { Route as rootRouteImport } from './routes/__root'
import { Route as TemplateProcessRouteImport } from './routes/template-process'
import { Route as ResultsRouteImport } from './routes/results'
import { Route as IndexRouteImport } from './routes/index'
import { Route as BulkProcessingRouteImport } from './routes/bulk-processing' // <-- Added

const TemplateProcessRoute = TemplateProcessRouteImport.update({
  id: '/template-process',
  path: '/template-process',
  getParentRoute: () => rootRouteImport,
} as any)

const ResultsRoute = ResultsRouteImport.update({
  id: '/results',
  path: '/results',
  getParentRoute: () => rootRouteImport,
} as any)

const BulkProcessingRoute = BulkProcessingRouteImport.update({
  id: '/bulk-processing',
  path: '/bulk-processing',
  getParentRoute: () => rootRouteImport,
} as any) // <-- Added

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/results': typeof ResultsRoute
  '/template-process': typeof TemplateProcessRoute
  '/bulk-processing': typeof BulkProcessingRoute // <-- Added
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/results': typeof ResultsRoute
  '/template-process': typeof TemplateProcessRoute
  '/bulk-processing': typeof BulkProcessingRoute // <-- Added
}

export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/results': typeof ResultsRoute
  '/template-process': typeof TemplateProcessRoute
  '/bulk-processing': typeof BulkProcessingRoute // <-- Added
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/results' | '/template-process' | '/bulk-processing' // <-- Added
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/results' | '/template-process' | '/bulk-processing' // <-- Added
  id: '__root__' | '/' | '/results' | '/template-process' | '/bulk-processing' // <-- Added
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  ResultsRoute: typeof ResultsRoute
  TemplateProcessRoute: typeof TemplateProcessRoute
  BulkProcessingRoute: typeof BulkProcessingRoute // <-- Added
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/template-process': {
      id: '/template-process'
      path: '/template-process'
      fullPath: '/template-process'
      preLoaderRoute: typeof TemplateProcessRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/results': {
      id: '/results'
      path: '/results'
      fullPath: '/results'
      preLoaderRoute: typeof ResultsRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/bulk-processing': { // <-- Added
      id: '/bulk-processing'
      path: '/bulk-processing'
      fullPath: '/bulk-processing'
      preLoaderRoute: typeof BulkProcessingRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  ResultsRoute: ResultsRoute,
  TemplateProcessRoute: TemplateProcessRoute,
  BulkProcessingRoute: BulkProcessingRoute, 
}

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()