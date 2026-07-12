# Implementation Plan: Location Management

## Overview

This implementation plan provides a step-by-step guide to building the Location Management feature for the asset management system. The feature introduces a hierarchical location structure (Buildings → Floors → Rooms) plus standalone Warehouses to replace the simple string-based location field in assets.

The implementation follows a repository pattern with clear separation of concerns: routes handle HTTP requests, controllers manage business logic, and repositories handle data access. Each step builds incrementally, ensuring core functionality is validated early through checkpoints.

## Tasks

- [ ] 1. Set up database schema and run migrations
  - Update Prisma schema with Building, Floor, Room, and Warehouse models
  - Add roomId and warehouseId foreign keys to Asset model
  - Generate and run Prisma migrations
  - Verify tables and indexes are created correctly
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 10.1, 10.2, 11.1, 11.2, 11.3_

- [ ] 2. Create repository layer for Building management
  - [ ] 2.1 Create Building repository with CRUD operations
    - Implement create, findById, findByCode, update, softDelete methods
    - Implement findAll with pagination support
    - Implement search method with name/code/address filtering
    - Implement getWithFullHierarchy, hasFloors, getAssetCount helper methods
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 5.3, 5.6_

  - [ ]* 2.2 Write unit tests for Building repository
    - Test all CRUD operations
    - Test pagination and search functionality
    - Test soft delete behavior
    - _Requirements: 1.1-1.8_

- [ ] 3. Create repository layer for Floor management
  - [ ] 3.1 Create Floor repository with CRUD operations
    - Implement create, findById, findByCode, update, softDelete methods
    - Implement findByBuilding and findAll with pagination
    - Implement search, hasRooms, getAssetCount helper methods
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 5.2, 5.6_

  - [ ]* 3.2 Write unit tests for Floor repository
    - Test all CRUD operations
    - Test parent-child relationships with Building
    - Test pagination and filtering
    - _Requirements: 2.1-2.9_

- [ ] 4. Create repository layer for Room management
  - [ ] 4.1 Create Room repository with CRUD operations
    - Implement create, findById, findByCode, update, softDelete methods
    - Implement findByFloor and findAll with pagination
    - Implement search, getAssetCount, getUtilization helper methods
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 5.1, 5.6, 12.1, 12.3, 12.5_

  - [ ]* 4.2 Write unit tests for Room repository
    - Test all CRUD operations
    - Test capacity and utilization calculations
    - Test hierarchy navigation
    - _Requirements: 3.1-3.10, 12.1, 12.3, 12.5_

- [ ] 5. Create repository layer for Warehouse management
  - [ ] 5.1 Create Warehouse repository with CRUD operations
    - Implement create, findById, findByCode, update, softDelete methods
    - Implement findAll with pagination
    - Implement search, getAssetCount, getUtilization helper methods
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.4, 12.2, 12.3, 12.6_

  - [ ]* 5.2 Write unit tests for Warehouse repository
    - Test all CRUD operations
    - Test capacity and utilization calculations
    - Test asset counting
    - _Requirements: 4.1-4.9, 12.2, 12.3, 12.6_

- [ ] 6. Checkpoint - Verify repository layer
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement location code generation utilities
  - [ ] 7.1 Create code generation utility module
    - Implement generateBuildingCode function (BLD-{sequential})
    - Implement generateWarehouseCode function (WH-{sequential})
    - Implement generateFloorCode function ({building_code}-F{floor_number})
    - Implement generateRoomCode function ({floor_code}-R{room_number})
    - Add uniqueness validation for custom codes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 7.2 Write unit tests for code generation utilities
    - Test sequential number generation
    - Test code format patterns
    - Test uniqueness validation
    - _Requirements: 6.1-6.6_

- [ ] 8. Implement validation utilities
  - [ ] 8.1 Create validation utility module
    - Implement validateBuildingData function with all field validations
    - Implement validateFloorData function with all field validations
    - Implement validateRoomData function with all field validations
    - Implement validateWarehouseData function with all field validations
    - Add input sanitization (trim whitespace)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10_

  - [ ]* 8.2 Write unit tests for validation utilities
    - Test required field validation
    - Test format validation (codes, lengths)
    - Test edge cases and boundary conditions
    - _Requirements: 9.1-9.10_

- [ ] 9. Implement Building controller and routes
  - [ ] 9.1 Create Building controller
    - Implement createBuilding handler with validation and error handling
    - Implement getBuildings handler with pagination
    - Implement getBuildingById handler
    - Implement updateBuilding handler
    - Implement deleteBuilding handler with dependency checking
    - Implement getBuildingWithHierarchy handler
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 5.3, 5.5, 13.1-13.8, 14.1-14.9_

  - [ ] 9.2 Create Building routes
    - Define POST /api/locations/buildings endpoint
    - Define GET /api/locations/buildings endpoint
    - Define GET /api/locations/buildings/:id endpoint
    - Define PUT /api/locations/buildings/:id endpoint
    - Define DELETE /api/locations/buildings/:id endpoint
    - Define GET /api/locations/buildings/:id/full endpoint
    - Apply authentication and authorization middleware
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

  - [ ]* 9.3 Write integration tests for Building endpoints
    - Test create, read, update, delete operations
    - Test authorization rules for different roles
    - Test error responses and validation
    - _Requirements: 1.1-1.8, 13.1-13.8, 14.1-14.9_

- [ ] 10. Implement Floor controller and routes
  - [ ] 10.1 Create Floor controller
    - Implement createFloor handler with building validation
    - Implement getFloors handler with pagination
    - Implement getFloorsByBuilding handler
    - Implement getFloorById handler
    - Implement updateFloor handler
    - Implement deleteFloor handler with dependency checking
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 5.2, 13.1-13.8, 14.1-14.9_

  - [ ] 10.2 Create Floor routes
    - Define POST /api/locations/floors endpoint
    - Define GET /api/locations/floors endpoint
    - Define GET /api/locations/buildings/:buildingId/floors endpoint
    - Define GET /api/locations/floors/:id endpoint
    - Define PUT /api/locations/floors/:id endpoint
    - Define DELETE /api/locations/floors/:id endpoint
    - Apply authentication and authorization middleware
    - _Requirements: 13.1-13.8_

  - [ ]* 10.3 Write integration tests for Floor endpoints
    - Test create, read, update, delete operations
    - Test parent-child relationship validation
    - Test duplicate floorNumber prevention
    - _Requirements: 2.1-2.9, 13.1-13.8, 14.1-14.9_

- [ ] 11. Implement Room controller and routes
  - [ ] 11.1 Create Room controller
    - Implement createRoom handler with floor validation
    - Implement getRooms handler with pagination
    - Implement getRoomsByFloor handler
    - Implement getRoomById handler with full hierarchy
    - Implement updateRoom handler
    - Implement deleteRoom handler
    - Implement getRoomAssets handler
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 5.1, 10.3, 12.1, 12.3, 12.5, 13.1-13.8, 14.1-14.9_

  - [ ] 11.2 Create Room routes
    - Define POST /api/locations/rooms endpoint
    - Define GET /api/locations/rooms endpoint
    - Define GET /api/locations/floors/:floorId/rooms endpoint
    - Define GET /api/locations/rooms/:id endpoint
    - Define PUT /api/locations/rooms/:id endpoint
    - Define DELETE /api/locations/rooms/:id endpoint
    - Define GET /api/locations/rooms/:id/assets endpoint
    - Apply authentication and authorization middleware
    - _Requirements: 13.1-13.8_

  - [ ]* 11.3 Write integration tests for Room endpoints
    - Test create, read, update, delete operations
    - Test capacity tracking and utilization
    - Test asset listing functionality
    - _Requirements: 3.1-3.10, 10.3, 12.1, 12.3, 12.5, 13.1-13.8, 14.1-14.9_

- [ ] 12. Implement Warehouse controller and routes
  - [ ] 12.1 Create Warehouse controller
    - Implement createWarehouse handler with validation
    - Implement getWarehouses handler with pagination
    - Implement getWarehouseById handler
    - Implement updateWarehouse handler
    - Implement deleteWarehouse handler
    - Implement getWarehouseAssets handler
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 10.3, 12.2, 12.3, 12.6, 13.1-13.8, 14.1-14.9_

  - [ ] 12.2 Create Warehouse routes
    - Define POST /api/locations/warehouses endpoint
    - Define GET /api/locations/warehouses endpoint
    - Define GET /api/locations/warehouses/:id endpoint
    - Define PUT /api/locations/warehouses/:id endpoint
    - Define DELETE /api/locations/warehouses/:id endpoint
    - Define GET /api/locations/warehouses/:id/assets endpoint
    - Apply authentication and authorization middleware
    - _Requirements: 13.1-13.8_

  - [ ]* 12.3 Write integration tests for Warehouse endpoints
    - Test create, read, update, delete operations
    - Test capacity tracking and utilization
    - Test asset listing functionality
    - _Requirements: 4.1-4.9, 10.3, 12.2, 12.3, 12.6, 13.1-13.8, 14.1-14.9_

- [ ] 13. Checkpoint - Verify all location endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement location hierarchy and search endpoints
  - [ ] 14.1 Create location hierarchy controller
    - Implement getLocationHierarchy handler for top-level locations
    - Implement searchLocations handler for cross-entity search
    - Add sorting by relevance for search results
    - _Requirements: 5.4, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [ ] 14.2 Create hierarchy and search routes
    - Define GET /api/locations/hierarchy endpoint
    - Define GET /api/locations/search endpoint with query parameters
    - Apply authentication middleware
    - _Requirements: 5.4, 7.1-7.8, 13.6_

  - [ ]* 14.3 Write integration tests for hierarchy and search
    - Test hierarchy navigation
    - Test cross-entity search
    - Test case-insensitive filtering
    - _Requirements: 5.4, 7.1-7.8_

- [ ] 15. Update Asset model and service for location integration
  - [ ] 15.1 Add location assignment methods to Asset service
    - Implement assignAssetToRoom function with validation
    - Implement assignAssetToWarehouse function with validation
    - Update asset retrieval to include location hierarchy
    - _Requirements: 10.1, 10.2, 10.7, 10.8_

  - [ ] 15.2 Create asset-location query endpoints
    - Implement getAssetsForBuilding aggregation (all rooms in building)
    - Implement getAssetsForFloor aggregation (all rooms on floor)
    - Implement getAssetsForRoom direct query
    - Implement getAssetsForWarehouse direct query
    - _Requirements: 10.3, 10.4, 10.5_

  - [ ]* 15.3 Write integration tests for asset-location integration
    - Test asset assignment to rooms and warehouses
    - Test asset retrieval by location hierarchy
    - Test soft delete behavior with assigned assets
    - _Requirements: 10.1-10.8_

- [ ] 16. Wire everything together in main routes index
  - [ ] 16.1 Integrate location routes into main API router
    - Import location router module
    - Mount location routes at /api/locations
    - Ensure middleware chain is properly applied
    - Test route registration
    - _Requirements: All location endpoints_

- [ ] 17. Create data migration script (optional for existing deployments)
  - [ ] 17.1 Create migration utility for existing asset locations
    - Parse currentLocation strings into structured locations
    - Create Buildings, Floors, Rooms, or Warehouses as needed
    - Update Asset records with new foreign keys
    - Provide rollback mechanism
    - _Requirements: 10.6_

  - [ ]* 17.2 Write tests for migration script
    - Test location string parsing
    - Test data transformation
    - Test rollback functionality
    - _Requirements: 10.6_

- [ ] 18. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- The implementation uses JavaScript/Node.js with Express and Prisma
- Repository pattern ensures clean separation of concerns and testability
- Authentication and authorization are applied at the route level using existing middleware
- Soft deletes preserve historical data for audit compliance
- All endpoints return consistent error responses following the design specification

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "4.2", "5.2", "7.1", "8.1"] },
    { "id": 3, "tasks": ["7.2", "8.2", "9.1", "10.1", "11.1", "12.1"] },
    { "id": 4, "tasks": ["9.2", "10.2", "11.2", "12.2"] },
    { "id": 5, "tasks": ["9.3", "10.3", "11.3", "12.3", "14.1"] },
    { "id": 6, "tasks": ["14.2"] },
    { "id": 7, "tasks": ["14.3", "15.1"] },
    { "id": 8, "tasks": ["15.2"] },
    { "id": 9, "tasks": ["15.3", "16.1"] },
    { "id": 10, "tasks": ["17.1"] },
    { "id": 11, "tasks": ["17.2"] }
  ]
}
```
