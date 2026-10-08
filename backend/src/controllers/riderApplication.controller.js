const riderApplicationService = require('../services/riderApplication.service');
const { success } = require('../utils/response');

async function create(req, res, next) {
  try {
    const application = await riderApplicationService.createApplication(req.user.id, req.body);
    const latest = await riderApplicationService.myApplication(req.user.id);
    return success(
      res,
      'Rider application submitted. You will be notified once an admin reviews it.',
      { application: latest },
      201
    );
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const application = await riderApplicationService.myApplication(req.user.id);
    return success(res, 'OK', { application });
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const data = await riderApplicationService.listApplications(req.query);
    return success(res, 'OK', data);
  } catch (error) {
    return next(error);
  }
}

async function approve(req, res, next) {
  try {
    const application = await riderApplicationService.approveApplication(
      req.params.id,
      req.user
    );
    return success(
      res,
      'Application approved. The applicant is now a rider and can take deliveries.',
      { application }
    );
  } catch (error) {
    return next(error);
  }
}

async function reject(req, res, next) {
  try {
    const application = await riderApplicationService.rejectApplication(
      req.params.id,
      req.user,
      req.body.reason
    );
    return success(res, 'Application rejected. The applicant stays a customer.', {
      application,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { create, me, list, approve, reject };