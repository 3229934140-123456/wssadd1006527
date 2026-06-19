import { Student, SchoolInfo } from '@/types'

export const mockSchools: SchoolInfo[] = [
  {
    id: 'sch001',
    name: '第一实验小学',
    classes: ['一年级1班', '一年级2班', '一年级3班', '二年级1班', '三年级1班'],
  },
  {
    id: 'sch002',
    name: '阳光小学',
    classes: ['一年级1班', '一年级2班', '二年级1班', '二年级2班', '三年级1班'],
  },
  {
    id: 'sch003',
    name: '红星路小学',
    classes: ['一年级1班', '二年级1班', '三年级1班', '四年级1班', '五年级1班'],
  },
]

const generateMockStudents = (): Student[] => {
  const now = new Date().toISOString()
  const yesterday = new Date(Date.now() - 86400000).toISOString()

  return [
    {
      id: 'stu001',
      name: '张明',
      className: '一年级1班',
      school: '第一实验小学',
      guardianPhone: '13800138001',
      gender: 'male',
      age: 7,
      createdAt: yesterday,
      updatedAt: now,
      toothRecords: [
        {
          toothId: '16',
          toothName: '16',
          status: 'suggest',
          updateTime: now,
        },
        {
          toothId: '26',
          toothName: '26',
          status: 'done',
          materialBatch: 'FH20240101',
          doctorSignature: '李医生',
          cooperation: 'good',
          updateTime: now,
        },
        {
          toothId: '36',
          toothName: '36',
          status: 'suggest',
          updateTime: now,
        },
        {
          toothId: '46',
          toothName: '46',
          status: 'delay',
          updateTime: now,
        },
      ],
    },
    {
      id: 'stu002',
      name: '李小红',
      className: '一年级1班',
      school: '第一实验小学',
      guardianPhone: '13800138002',
      gender: 'female',
      age: 6,
      createdAt: yesterday,
      updatedAt: now,
      toothRecords: [
        {
          toothId: '16',
          toothName: '16',
          status: 'done',
          materialBatch: 'FH20240102',
          doctorSignature: '王医生',
          cooperation: 'good',
          updateTime: now,
        },
        {
          toothId: '26',
          toothName: '26',
          status: 'done',
          materialBatch: 'FH20240102',
          doctorSignature: '王医生',
          cooperation: 'good',
          updateTime: now,
        },
      ],
    },
    {
      id: 'stu003',
      name: '王浩宇',
      className: '一年级2班',
      school: '第一实验小学',
      guardianPhone: '13800138003',
      gender: 'male',
      age: 7,
      createdAt: yesterday,
      updatedAt: now,
      toothRecords: [
        {
          toothId: '16',
          toothName: '16',
          status: 'suggest',
          updateTime: now,
        },
        {
          toothId: '55',
          toothName: '55',
          status: 'delay',
          updateTime: now,
        },
      ],
    },
    {
      id: 'stu004',
      name: '陈雨萱',
      className: '一年级1班',
      school: '第一实验小学',
      guardianPhone: '13800138004',
      gender: 'female',
      age: 6,
      createdAt: yesterday,
      updatedAt: yesterday,
      toothRecords: [],
    },
    {
      id: 'stu005',
      name: '刘子轩',
      className: '一年级2班',
      school: '第一实验小学',
      guardianPhone: '13800138005',
      gender: 'male',
      age: 7,
      createdAt: now,
      updatedAt: now,
      toothRecords: [
        {
          toothId: '36',
          toothName: '36',
          status: 'done',
          materialBatch: 'FH20240103',
          doctorSignature: '李医生',
          cooperation: 'normal',
          updateTime: now,
        },
      ],
    },
    {
      id: 'stu006',
      name: '赵欣怡',
      className: '二年级1班',
      school: '第一实验小学',
      guardianPhone: '13800138006',
      gender: 'female',
      age: 8,
      createdAt: now,
      updatedAt: now,
      toothRecords: [
        {
          toothId: '14',
          toothName: '14',
          status: 'suggest',
          updateTime: now,
        },
        {
          toothId: '24',
          toothName: '24',
          status: 'suggest',
          updateTime: now,
        },
        {
          toothId: '15',
          toothName: '15',
          status: 'done',
          materialBatch: 'FH20240104',
          doctorSignature: '张医生',
          cooperation: 'good',
          updateTime: now,
        },
      ],
    },
    {
      id: 'stu007',
      name: '孙浩然',
      className: '一年级1班',
      school: '阳光小学',
      guardianPhone: '13800138007',
      gender: 'male',
      age: 7,
      createdAt: now,
      updatedAt: now,
      toothRecords: [],
    },
    {
      id: 'stu008',
      name: '周梦瑶',
      className: '一年级1班',
      school: '阳光小学',
      guardianPhone: '13800138008',
      gender: 'female',
      age: 6,
      createdAt: now,
      updatedAt: now,
      toothRecords: [
        {
          toothId: '16',
          toothName: '16',
          status: 'delay',
          updateTime: now,
        },
      ],
    },
    {
      id: 'stu009',
      name: '吴俊杰',
      className: '二年级1班',
      school: '阳光小学',
      guardianPhone: '13800138009',
      gender: 'male',
      age: 8,
      createdAt: yesterday,
      updatedAt: now,
      toothRecords: [
        {
          toothId: '16',
          toothName: '16',
          status: 'done',
          materialBatch: 'FH20240105',
          doctorSignature: '李医生',
          cooperation: 'poor',
          updateTime: now,
        },
        {
          toothId: '26',
          toothName: '26',
          status: 'done',
          materialBatch: 'FH20240105',
          doctorSignature: '李医生',
          cooperation: 'poor',
          updateTime: now,
        },
        {
          toothId: '36',
          toothName: '36',
          status: 'done',
          materialBatch: 'FH20240105',
          doctorSignature: '李医生',
          cooperation: 'poor',
          updateTime: now,
        },
        {
          toothId: '46',
          toothName: '46',
          status: 'done',
          materialBatch: 'FH20240105',
          doctorSignature: '李医生',
          cooperation: 'poor',
          updateTime: now,
        },
      ],
    },
    {
      id: 'stu010',
      name: '郑思琪',
      className: '三年级1班',
      school: '红星路小学',
      guardianPhone: '13800138010',
      gender: 'female',
      age: 9,
      createdAt: yesterday,
      updatedAt: now,
      toothRecords: [
        {
          toothId: '17',
          toothName: '17',
          status: 'suggest',
          updateTime: now,
        },
        {
          toothId: '27',
          toothName: '27',
          status: 'suggest',
          updateTime: now,
        },
        {
          toothId: '37',
          toothName: '37',
          status: 'suggest',
          updateTime: now,
        },
        {
          toothId: '47',
          toothName: '47',
          status: 'suggest',
          updateTime: now,
        },
      ],
    },
  ]
}

export const mockStudents = generateMockStudents()

export const initMockData = () => {
  const { storage } = require('@/utils/storage')
  const existing = storage.getStudents()
  if (existing.length === 0) {
    storage.saveStudents(mockStudents)
    storage.saveSchools(mockSchools)
    storage.setCurrentSchool('第一实验小学')
    storage.setCurrentClass('一年级1班')
    console.log('[Mock] Initialized with mock data')
  }
}
