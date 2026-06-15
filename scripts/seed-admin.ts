import { AppDataSource } from '../backend/src/config/database';
import { Staff } from '../backend/src/models/staff.entity';
import { hashPassword } from '../backend/src/utils/password';

async function seedAdmin() {
  try {
    // 初始化数据库连接
    await AppDataSource.initialize();
    console.log('[INFO] 数据库连接成功');

    const staffRepository = AppDataSource.getRepository(Staff);

    // 检查 admin 用户是否已存在
    const existingAdmin = await staffRepository.findOne({
      where: { username: 'admin' },
    });

    if (existingAdmin) {
      console.log('[INFO] admin 用户已存在，跳过创建');
      await AppDataSource.destroy();
      process.exit(0);
    }

    // 创建 admin 用户
    const passwordHash = await hashPassword('admin123');
    
    const admin = staffRepository.create({
      name: '系统管理员',
      username: 'admin',
      passwordHash: passwordHash,
      systemRole: '系统管理员',
      businessDivision: '管理部',
      isActive: true,
    });

    await staffRepository.save(admin);
    console.log('[INFO] admin 用户创建成功！');
    console.log('[INFO] 用户名: admin');
    console.log('[INFO] 密码: admin123');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] 创建 admin 用户失败:', error);
    process.exit(1);
  }
}

seedAdmin();
