
const express = require('express');
const router = express.Router();
const db = require('../_helpers/db');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');

router.post('/', authorize(Role.Admin), create);
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.put('/:id', authorize(Role.Admin), update);
router.delete('/:id', authorize(Role.Admin), _delete);
router.post('/:id/transfer', authorize(Role.Admin), transfer);

async function create(req, res, next) {
    try {
        const { accountId, departmentId, ...employeeData } = req.body;
        
        if (!departmentId) {
            throw new Error('Department must be selected');
        }
        
        const department = await db.Department.findByPk(departmentId);
        if (!department) {
            throw new Error('Department not found');
        }
        
        if (!accountId) {
            throw new Error('Account must be assigned');
        }
        
        const account = await db.Account.findByPk(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        
        if (!account.isActive) {
            throw new Error('Only active accounts can be assigned to employees');
        }
        
        const employee = await db.Employee.create({
            ...employeeData,
            departmentId: departmentId
        });
        
        await employee.setAccount(account);
        
        await db.Workflow.create({
            type: 'Onboarding',
            status: 'Pending',
            employeeId: employee.id,
            departmentId: departmentId,
            details: {
                position: employeeData.position,
                hireDate: employeeData.hireDate,
                status: 'New Hire'
            },
            created: new Date()
        });
        
        const createdEmployee = await db.Employee.findByPk(employee.id, {
            include: [
                { model: db.Account }, 
                { model: db.Department }
            ]
        });
        
        res.status(201).json(createdEmployee);
    } catch (err) { 
        next(err); 
    }
}

async function getAll(req, res, next) {
    try {
        const employees = await db.Employee.findAll({
            include: [{ model: db.Account }, { model: db.Department }]
        });
        res.json(employees);
    } catch (err) { 
        next(err); 
    }
}
async function getById(req, res, next) {
    try {
        const employee = await db.Employee.findByPk(req.params.id, {
            include: [{ model: db.Account }, { model: db.Department }]
        });
        if (!employee) throw new Error('Employee not found');
        res.json(employee);
    } catch (err) { 
        next(err); 
    }
}
async function update(req, res, next) {
    try {
        const employee = await db.Employee.findByPk(req.params.id);
        if (!employee) throw new Error('Employee not found');
        await employee.update(req.body);
        res.json(employee);
    } catch (err) { 
        next(err); 
    }
}
async function _delete(req, res, next) {
    try {
        const employee = await db.Employee.findByPk(req.params.id);
        if (!employee) throw new Error('Employee not found');
        await employee.destroy();
        res.json({ message: 'Employee deleted' });
    } catch (err) { 
        next(err); 
    }
}
async function transfer(req, res, next) {
    try {
        const employee = await db.Employee.findByPk(req.params.id, {
            include: [{ model: db.Department }]
        });
        
        if (!employee) {
            throw new Error('Employee not found');
        }
        
        const oldDepartmentId = employee.departmentId;
        const newDepartmentId = req.body.departmentId;
        
        if (oldDepartmentId === newDepartmentId) {
            throw new Error('Employee is already in this department');
        }
        
        const newDepartment = await db.Department.findByPk(newDepartmentId);
        if (!newDepartment) {
            throw new Error('Target department not found');
        }
        
        const oldDepartmentName = employee.department ? employee.department.name : 'Unknown';
        
        await employee.update({ 
            departmentId: newDepartmentId,
            updated: new Date()
        });
        
        const workflow = await db.Workflow.create({
            type: 'Transfer',
            status: 'Pending', 
            employeeId: employee.id,
            departmentId: newDepartmentId,
            details: {
                oldDepartmentId: oldDepartmentId,
                oldDepartmentName: oldDepartmentName,
                newDepartmentId: newDepartmentId,
                newDepartmentName: newDepartment.name,
                transferDate: new Date(),
                requestedBy: req.user ? req.user.id : null
            },
            created: new Date()
        });
        
        const oldDepartmentCount = await db.Employee.count({ 
            where: { departmentId: oldDepartmentId } 
        });
        
        const newDepartmentCount = await db.Employee.count({ 
            where: { departmentId: newDepartmentId } 
        });
        
        res.json({
            message: 'Employee transferred successfully',
            employee: {
                id: employee.id,
                name: `${employee.firstName} ${employee.lastName}`,
                newDepartment: newDepartment.name
            },
            workflow: {
                id: workflow.id,
                type: workflow.type,
                status: workflow.status
            },
            departmentCounts: {
                [oldDepartmentId]: oldDepartmentCount,
                [newDepartmentId]: newDepartmentCount
            }
        });
    } catch (err) {
        next(err);
    }
}
module.exports = router;