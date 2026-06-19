export type TreatmentStatus = 'suggest' | 'done' | 'delay'

export type CooperationLevel = 'good' | 'normal' | 'poor'

export interface ToothRecord {
  toothId: string
  toothName: string
  status: TreatmentStatus
  materialBatch?: string
  doctorSignature?: string
  cooperation?: CooperationLevel
  updateTime: string
}

export interface Student {
  id: string
  name: string
  className: string
  school: string
  guardianPhone: string
  gender: 'male' | 'female'
  age?: number
  toothRecords: ToothRecord[]
  createdAt: string
  updatedAt: string
  remark?: string
}

export interface SchoolInfo {
  id: string
  name: string
  classes: string[]
}

export interface SummaryStats {
  totalStudents: number
  completedStudents: number
  pendingStudents: number
  suggestCount: number
  doneCount: number
  delayCount: number
}

export interface ClassSummary {
  className: string
  total: number
  completed: number
  pending: number
  students: Student[]
}

export interface SchoolSummary {
  schoolId: string
  schoolName: string
  total: number
  completed: number
  pending: number
  classes: ClassSummary[]
}

export type ToothType = 'permanent' | 'primary'

export interface ToothPosition {
  id: string
  name: string
  position: string
  type: ToothType
}

export const PERMANENT_TEETH: ToothPosition[] = [
  { id: '18', name: '18', position: '右上第三磨牙', type: 'permanent' },
  { id: '17', name: '17', position: '右上第二磨牙', type: 'permanent' },
  { id: '16', name: '16', position: '右上第一磨牙', type: 'permanent' },
  { id: '15', name: '15', position: '右上第二前磨牙', type: 'permanent' },
  { id: '14', name: '14', position: '右上第一前磨牙', type: 'permanent' },
  { id: '13', name: '13', position: '右上尖牙', type: 'permanent' },
  { id: '12', name: '12', position: '右上侧切牙', type: 'permanent' },
  { id: '11', name: '11', position: '右上中切牙', type: 'permanent' },
  { id: '21', name: '21', position: '左上中切牙', type: 'permanent' },
  { id: '22', name: '22', position: '左上侧切牙', type: 'permanent' },
  { id: '23', name: '23', position: '左上尖牙', type: 'permanent' },
  { id: '24', name: '24', position: '左上第一前磨牙', type: 'permanent' },
  { id: '25', name: '25', position: '左上第二前磨牙', type: 'permanent' },
  { id: '26', name: '26', position: '左上第一磨牙', type: 'permanent' },
  { id: '27', name: '27', position: '左上第二磨牙', type: 'permanent' },
  { id: '28', name: '28', position: '左上第三磨牙', type: 'permanent' },
  { id: '48', name: '48', position: '右下第三磨牙', type: 'permanent' },
  { id: '47', name: '47', position: '右下第二磨牙', type: 'permanent' },
  { id: '46', name: '46', position: '右下第一磨牙', type: 'permanent' },
  { id: '45', name: '45', position: '右下第二前磨牙', type: 'permanent' },
  { id: '44', name: '44', position: '右下第一前磨牙', type: 'permanent' },
  { id: '43', name: '43', position: '右下尖牙', type: 'permanent' },
  { id: '42', name: '42', position: '右下侧切牙', type: 'permanent' },
  { id: '41', name: '41', position: '右下中切牙', type: 'permanent' },
  { id: '31', name: '31', position: '左下中切牙', type: 'permanent' },
  { id: '32', name: '32', position: '左下侧切牙', type: 'permanent' },
  { id: '33', name: '33', position: '左下尖牙', type: 'permanent' },
  { id: '34', name: '34', position: '左下第一前磨牙', type: 'permanent' },
  { id: '35', name: '35', position: '左下第二前磨牙', type: 'permanent' },
  { id: '36', name: '36', position: '左下第一磨牙', type: 'permanent' },
  { id: '37', name: '37', position: '左下第二磨牙', type: 'permanent' },
  { id: '38', name: '38', position: '左下第三磨牙', type: 'permanent' },
]

export const PRIMARY_TEETH: ToothPosition[] = [
  { id: '55', name: '55', position: '右上第二乳磨牙', type: 'primary' },
  { id: '54', name: '54', position: '右上第一乳磨牙', type: 'primary' },
  { id: '53', name: '53', position: '右上乳尖牙', type: 'primary' },
  { id: '52', name: '52', position: '右上乳侧切牙', type: 'primary' },
  { id: '51', name: '51', position: '右上乳中切牙', type: 'primary' },
  { id: '61', name: '61', position: '左上乳中切牙', type: 'primary' },
  { id: '62', name: '62', position: '左上乳侧切牙', type: 'primary' },
  { id: '63', name: '63', position: '左上乳尖牙', type: 'primary' },
  { id: '64', name: '64', position: '左上第一乳磨牙', type: 'primary' },
  { id: '65', name: '65', position: '左上第二乳磨牙', type: 'primary' },
  { id: '85', name: '85', position: '右下第二乳磨牙', type: 'primary' },
  { id: '84', name: '84', position: '右下第一乳磨牙', type: 'primary' },
  { id: '83', name: '83', position: '右下乳尖牙', type: 'primary' },
  { id: '82', name: '82', position: '右下乳侧切牙', type: 'primary' },
  { id: '81', name: '81', position: '右下乳中切牙', type: 'primary' },
  { id: '71', name: '71', position: '左下乳中切牙', type: 'primary' },
  { id: '72', name: '72', position: '左下乳侧切牙', type: 'primary' },
  { id: '73', name: '73', position: '左下乳尖牙', type: 'primary' },
  { id: '74', name: '74', position: '左下第一乳磨牙', type: 'primary' },
  { id: '75', name: '75', position: '左下第二乳磨牙', type: 'primary' },
]

export const STATUS_LABEL: Record<TreatmentStatus, string> = {
  suggest: '建议封闭',
  done: '已封闭',
  delay: '暂缓处理',
}

export const COOPERATION_LABEL: Record<CooperationLevel, string> = {
  good: '配合良好',
  normal: '一般',
  poor: '配合较差',
}
