import Taro from '@tarojs/taro'
import { Student, SchoolInfo } from '@/types'

const STORAGE_KEYS = {
  STUDENTS: 'seal_students',
  SCHOOLS: 'seal_schools',
  CURRENT_SCHOOL: 'seal_current_school',
  CURRENT_CLASS: 'seal_current_class',
}

export const storage = {
  getStudents(): Student[] {
    try {
      const data = Taro.getStorageSync(STORAGE_KEYS.STUDENTS)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('[Storage] getStudents error:', e)
      return []
    }
  },

  saveStudents(students: Student[]): void {
    try {
      Taro.setStorageSync(STORAGE_KEYS.STUDENTS, JSON.stringify(students))
      console.log('[Storage] saveStudents success, count:', students.length)
    } catch (e) {
      console.error('[Storage] saveStudents error:', e)
    }
  },

  addStudent(student: Student): Student[] {
    const students = this.getStudents()
    students.unshift(student)
    this.saveStudents(students)
    return students
  },

  updateStudent(student: Student): Student[] {
    const students = this.getStudents()
    const index = students.findIndex(s => s.id === student.id)
    if (index > -1) {
      students[index] = {
        ...student,
        updatedAt: new Date().toISOString(),
      }
      this.saveStudents(students)
    }
    return students
  },

  deleteStudent(id: string): Student[] {
    const students = this.getStudents().filter(s => s.id !== id)
    this.saveStudents(students)
    return students
  },

  getSchools(): SchoolInfo[] {
    try {
      const data = Taro.getStorageSync(STORAGE_KEYS.SCHOOLS)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('[Storage] getSchools error:', e)
      return []
    }
  },

  saveSchools(schools: SchoolInfo[]): void {
    try {
      Taro.setStorageSync(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools))
    } catch (e) {
      console.error('[Storage] saveSchools error:', e)
    }
  },

  getCurrentSchool(): string {
    try {
      return Taro.getStorageSync(STORAGE_KEYS.CURRENT_SCHOOL) || ''
    } catch (e) {
      return ''
    }
  },

  setCurrentSchool(school: string): void {
    try {
      Taro.setStorageSync(STORAGE_KEYS.CURRENT_SCHOOL, school)
    } catch (e) {
      console.error('[Storage] setCurrentSchool error:', e)
    }
  },

  getCurrentClass(): string {
    try {
      return Taro.getStorageSync(STORAGE_KEYS.CURRENT_CLASS) || ''
    } catch (e) {
      return ''
    }
  },

  setCurrentClass(cls: string): void {
    try {
      Taro.setStorageSync(STORAGE_KEYS.CURRENT_CLASS, cls)
    } catch (e) {
      console.error('[Storage] setCurrentClass error:', e)
    }
  },

  clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        Taro.removeStorageSync(key)
      })
    } catch (e) {
      console.error('[Storage] clearAll error:', e)
    }
  },
}

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
