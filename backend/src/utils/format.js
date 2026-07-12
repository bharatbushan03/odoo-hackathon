const roleOut = {
  ADMIN: 'Admin',
  ASSET_MANAGER: 'AssetManager',
  DEPT_HEAD: 'DepartmentHead',
  EMPLOYEE: 'Employee',
};

const roleIn = {
  Admin: 'ADMIN',
  AssetManager: 'ASSET_MANAGER',
  DepartmentHead: 'DEPT_HEAD',
  Employee: 'EMPLOYEE',
};

const deptStatusOut = { ACTIVE: 'Active', INACTIVE: 'Inactive' };
const deptStatusIn = { Active: 'ACTIVE', Inactive: 'INACTIVE' };
const conditionIn = { New: 'NEW', Good: 'GOOD', Fair: 'FAIR', Poor: 'POOR' };
const conditionOut = { NEW: 'New', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor' };

const categoryStatusOut = { ACTIVE: 'Active', INACTIVE: 'Inactive' };
const categoryStatusIn = { Active: 'ACTIVE', Inactive: 'INACTIVE' };

const depreciationMethodOut = {
  STRAIGHT_LINE: 'StraightLine',
  DECLINING_BALANCE: 'DecliningBalance',
  DOUBLE_DECLINING: 'DoubleDeclining',
  SUM_OF_YEARS: 'SumOfYears',
  UNITS_OF_PRODUCTION: 'UnitsOfProduction',
  NONE: 'None',
};

const depreciationMethodIn = {
  StraightLine: 'STRAIGHT_LINE',
  DecliningBalance: 'DECLINING_BALANCE',
  DoubleDeclining: 'DOUBLE_DECLINING',
  SumOfYears: 'SUM_OF_YEARS',
  UnitsOfProduction: 'UNITS_OF_PRODUCTION',
  None: 'NONE',
};

const assetStatusIn = {
  Available: 'Available',
  Allocated: 'Allocated',
  Reserved: 'Reserved',
  'Under Maintenance': 'UnderMaintenance',
  Lost: 'Lost',
  Retired: 'Retired',
  Disposed: 'Disposed',
};

const assetStatusOut = {
  Available: 'Available',
  Allocated: 'Allocated',
  Reserved: 'Reserved',
  UnderMaintenance: 'Under Maintenance',
  Lost: 'Lost',
  Retired: 'Retired',
  Disposed: 'Disposed',
};

const isoDate = (date) => (date ? date.toISOString().slice(0, 10) : null);

function employee(e) {
  return {
    id: e.id,
    name: e.name,
    email: e.email,
    role: roleOut[e.role],
    departmentId: e.departmentId,
    createdAt: e.createdAt?.toISOString(),
  };
}

function department(d) {
  return {
    id: d.id,
    name: d.name,
    parentId: d.parentId,
    departmentHeadId: d.departmentHeadId,
    departmentHead: d.departmentHead ? {
      id: d.departmentHead.id,
      name: d.departmentHead.name,
      email: d.departmentHead.email,
      role: roleOut[d.departmentHead.role],
    } : null,
    status: deptStatusOut[d.status],
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

function category(c) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    parentId: c.parentId,
    parent: c.parent ? {
      id: c.parent.id,
      name: c.parent.name,
    } : null,
    depreciationMethod: depreciationMethodOut[c.depreciationMethod],
    expectedLife: c.expectedLife,
    image: c.image,
    status: categoryStatusOut[c.status],
    customFields: c.customFields || {},
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function assetFull(a) {
  return {
    id: a.id,
    name: a.name,
    assetTag: a.assetTag,
    serialNumber: a.serialNumber,
    acquisitionDate: isoDate(a.acquisitionDate),
    cost: a.cost,
    condition: conditionOut[a.condition],
    location: a.location,
    shared: a.shared,
    bookable: a.bookable,
    status: assetStatusOut[a.status],
    categoryId: a.categoryId,
    departmentId: a.departmentId,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function assetList(a) {
  return {
    id: a.id,
    name: a.name,
    assetTag: a.assetTag,
    serialNumber: a.serialNumber,
    status: assetStatusOut[a.status],
    category: { id: a.category.id, name: a.category.name },
    department: a.department ? { id: a.department.id, name: a.department.name } : null,
    location: a.location,
    shared: a.shared,
    bookable: a.bookable,
  };
}

function allocation(a, holderName) {
  return {
    id: a.id,
    assetId: a.assetId,
    assetTag: a.asset.assetTag,
    holderType: a.holderType,
    holderId: a.holderId,
    holderName: holderName || a.holderName,
    expectedReturnDate: isoDate(a.expectedReturnDate),
    allocatedAt: a.createdAt.toISOString(),
    status: a.status === 'ACTIVE' ? 'Active' : a.status === 'RETURNED' ? 'Returned' : 'Overdue',
  };
}

module.exports = {
  roleOut,
  roleIn,
  deptStatusIn,
  deptStatusOut,
  categoryStatusIn,
  categoryStatusOut,
  depreciationMethodIn,
  depreciationMethodOut,
  assetStatusIn,
  assetStatusOut,
  conditionIn,
  conditionOut,
  employee,
  department,
  category,
  assetFull,
  assetList,
  allocation,
  isoDate,
};
