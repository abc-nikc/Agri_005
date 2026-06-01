import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * 请求参数验证中间件工厂函数
 * @param schema Joi 验证模式
 * @param property 要验证的请求部分 (body, query, params)
 */
export const validateRequest = (
  schema: Joi.ObjectSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[property];
    const { error, value } = schema.validate(data, {
      abortEarly: false, // 返回所有验证错误
      allowUnknown: true, // 允许未定义的字段
      stripUnknown: true, // 移除未定义的字段
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: '请求参数验证失败',
        code: 'VALIDATION_ERROR',
        details,
      });
    }

    // 将验证后的值赋回请求对象
    req[property] = value;
    next();
  };
};

// ==================== 常用验证模式 ====================

export const schemas = {
  // UUID 参数验证
  uuidParam: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  // 分页查询参数
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
  }),

  // 登录请求
  login: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required(),
    password: Joi.string().min(8).max(100).required(),
  }),

  // 创建地块
  createPlot: Joi.object({
    plotNumber: Joi.string().max(50).required(),
    area: Joi.number().positive().required(),
    soilType: Joi.string().max(50).optional().allow(null, ''),
    region: Joi.string().max(50).required(),
    status: Joi.string().valid('已种植', '闲置').default('闲置'),
  }),

  // 创建品种
  createVariety: Joi.object({
    name: Joi.string().max(100).required(),
    category: Joi.string().max(50).required(),
    sowingSeason: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string()
    ).optional(),
    plantingDensity: Joi.number().integer().positive().optional().allow(null),
    fertilizationRate: Joi.number().positive().optional().allow(null),
    wateringFrequency: Joi.number().integer().positive().optional().allow(null),
    growthCycle: Joi.number().integer().positive().optional().allow(null),
    safetyInterval: Joi.number().integer().min(0).optional().allow(null),
  }),

  // 创建员工
  createStaff: Joi.object({
    name: Joi.string().max(100).required(),
    username: Joi.string().alphanum().min(3).max(50).required(),
    password: Joi.string().min(8).max(100).required(),
    systemRole: Joi.string()
      .valid('系统管理员', '农艺师', '操作员', '只读观察者')
      .required(),
    businessDivision: Joi.string().max(50).optional(),
    contactPhone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
  }),

  // 农事操作
  createFarmingOperation: Joi.object({
    operationType: Joi.string()
      .valid('播种', '施肥', '打药', '灌溉', '除草', '采收')
      .required(),
    batchId: Joi.string().uuid().required(),
    plotId: Joi.string().uuid().required(),
    operationDate: Joi.date().required(),
    operationTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
      .required(),
    details: Joi.object().required(),
    weatherCondition: Joi.string().max(100).optional(),
    isSupplemental: Joi.boolean().default(false),
  }),
};
