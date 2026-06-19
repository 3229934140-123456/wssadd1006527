import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Student, ToothRecord, SchoolInfo, TreatmentStatus, PERMANENT_TEETH, PRIMARY_TEETH, FollowUpRecord, FollowUpStatus } from '@/types'
import { storage, generateId } from '@/utils/storage'

interface AppContextType {
  students: Student[]
  schools: SchoolInfo[]
  followUps: FollowUpRecord[]
  currentSchool: string
  currentClass: string
  loading: boolean
  refreshData: () => void
  addStudent: (data: Omit<Student, 'id' | 'toothRecords' | 'createdAt' | 'updatedAt'>) => Student
  updateToothRecord: (studentId: string, toothId: string, status: TreatmentStatus, extra?: Partial<ToothRecord>) => void
  batchUpdateToothRecords: (studentId: string, toothIds: string[], status: TreatmentStatus, extra?: Partial<ToothRecord>) => void
  setCurrentSchool: (school: string) => void
  setCurrentClass: (cls: string) => void
  getStudentById: (id: string) => Student | undefined
  deleteStudent: (id: string) => void
  updateStudent: (student: Student) => void
  addSchool: (name: string, className?: string) => void
  addClassToSchool: (schoolName: string, className: string) => void
  getFollowUpByStudent: (studentId: string) => FollowUpRecord | undefined
  upsertFollowUp: (studentId: string, data: Partial<FollowUpRecord>) => void
  batchUpsertFollowUps: (studentIds: string[], data: Partial<FollowUpRecord>) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([])
  const [schools, setSchools] = useState<SchoolInfo[]>([])
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([])
  const [currentSchool, setCurrentSchoolState] = useState('')
  const [currentClass, setCurrentClassState] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = useCallback(() => {
    try {
      setLoading(true)
      const loadedStudents = storage.getStudents()
      const loadedSchools = storage.getSchools()
      const loadedFollowUps = storage.getFollowUps()
      const savedSchool = storage.getCurrentSchool()
      const savedClass = storage.getCurrentClass()

      setStudents(loadedStudents)
      setSchools(loadedSchools)
      setFollowUps(loadedFollowUps)
      setCurrentSchoolState(savedSchool)
      setCurrentClassState(savedClass)

      console.log('[AppContext] Data loaded, students:', loadedStudents.length, 'followUps:', loadedFollowUps.length)
    } catch (e) {
      console.error('[AppContext] loadData error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshData = useCallback(() => {
    loadData()
  }, [loadData])

  const addStudent = useCallback((data: Omit<Student, 'id' | 'toothRecords' | 'createdAt' | 'updatedAt'>): Student => {
    const now = new Date().toISOString()
    const newStudent: Student = {
      ...data,
      id: generateId(),
      toothRecords: [],
      createdAt: now,
      updatedAt: now,
    }

    const updated = storage.addStudent(newStudent)
    setStudents(updated)
    console.log('[AppContext] Student added:', newStudent.name)
    return newStudent
  }, [])

  const updateStudent = useCallback((student: Student) => {
    const updated = storage.updateStudent(student)
    setStudents(updated)
    console.log('[AppContext] Student updated:', student.name)
  }, [])

  const updateToothRecord = useCallback((
    studentId: string,
    toothId: string,
    status: TreatmentStatus,
    extra?: Partial<ToothRecord>
  ) => {
    const student = students.find(s => s.id === studentId)
    if (!student) return

    const existingIndex = student.toothRecords.findIndex(r => r.toothId === toothId)
    const now = new Date().toISOString()

    let newRecords: ToothRecord[]
    if (existingIndex > -1) {
      newRecords = [...student.toothRecords]
      newRecords[existingIndex] = {
        ...newRecords[existingIndex],
        status,
        updateTime: now,
        ...extra,
      }
    } else {
      const toothInfo = getToothInfo(toothId)
      newRecords = [
        ...student.toothRecords,
        {
          toothId,
          toothName: toothInfo?.name || toothId,
          status,
          updateTime: now,
          ...extra,
        },
      ]
    }

    const updatedStudent = {
      ...student,
      toothRecords: newRecords,
      updatedAt: now,
    }

    const updated = storage.updateStudent(updatedStudent)
    setStudents(updated)
    console.log('[AppContext] Tooth record updated:', toothId, status)
  }, [students])

  const getToothInfo = (toothId: string) => {
    const allTeeth = PERMANENT_TEETH.concat(PRIMARY_TEETH)
    return allTeeth.find((t) => t.id === toothId)
  }

  const setCurrentSchool = useCallback((school: string) => {
    setCurrentSchoolState(school)
    storage.setCurrentSchool(school)
  }, [])

  const setCurrentClass = useCallback((cls: string) => {
    setCurrentClassState(cls)
    storage.setCurrentClass(cls)
  }, [])

  const getStudentById = useCallback((id: string): Student | undefined => {
    return students.find(s => s.id === id)
  }, [students])

  const deleteStudent = useCallback((id: string) => {
    const updated = storage.deleteStudent(id)
    setStudents(updated)
    console.log('[AppContext] Student deleted:', id)
  }, [])

  const addSchool = useCallback((name: string, className?: string) => {
    const existing = schools.find(s => s.name === name)
    if (existing) {
      if (className && !existing.classes.includes(className)) {
        existing.classes.push(className)
        const updated = [...schools]
        storage.saveSchools(updated)
        setSchools(updated)
      }
      return
    }
    const newSchool: SchoolInfo = {
      id: generateId(),
      name,
      classes: className ? [className] : [],
    }
    const updated = [...schools, newSchool]
    storage.saveSchools(updated)
    setSchools(updated)
    console.log('[AppContext] School added:', name)
  }, [schools])

  const addClassToSchool = useCallback((schoolName: string, className: string) => {
    const school = schools.find(s => s.name === schoolName)
    if (!school) return
    if (!school.classes.includes(className)) {
      school.classes.push(className)
      const updated = [...schools]
      storage.saveSchools(updated)
      setSchools(updated)
    }
  }, [schools])

  const getFollowUpByStudent = useCallback((studentId: string): FollowUpRecord | undefined => {
    return followUps.find(r => r.studentId === studentId)
  }, [followUps])

  const upsertFollowUp = useCallback((studentId: string, data: Partial<FollowUpRecord>) => {
    const updated = storage.upsertFollowUp(studentId, data)
    setFollowUps(updated)
    console.log('[AppContext] FollowUp upserted for student:', studentId, data.status)
  }, [])

  const batchUpsertFollowUps = useCallback((studentIds: string[], data: Partial<FollowUpRecord>) => {
    const updated = storage.batchUpsertFollowUps(studentIds, data)
    setFollowUps(updated)
    console.log('[AppContext] FollowUp batch upserted, count:', studentIds.length, data.status)
  }, [])

  const batchUpdateToothRecords = useCallback((
    studentId: string,
    toothIds: string[],
    status: TreatmentStatus,
    extra?: Partial<ToothRecord>
  ) => {
    const student = students.find(s => s.id === studentId)
    if (!student) return

    const now = new Date().toISOString()
    let newRecords = [...student.toothRecords]

    toothIds.forEach(toothId => {
      const existingIndex = newRecords.findIndex(r => r.toothId === toothId)
      if (existingIndex > -1) {
        newRecords[existingIndex] = {
          ...newRecords[existingIndex],
          status,
          updateTime: now,
          ...extra,
        }
      } else {
        const toothInfo = getToothInfo(toothId)
        newRecords.push({
          toothId,
          toothName: toothInfo?.name || toothId,
          status,
          updateTime: now,
          ...extra,
        })
      }
    })

    const updatedStudent = {
      ...student,
      toothRecords: newRecords,
      updatedAt: now,
    }

    const updated = storage.updateStudent(updatedStudent)
    setStudents(updated)
    console.log('[AppContext] Batch tooth records updated:', toothIds.length, 'teeth')
  }, [students])

  return (
    <AppContext.Provider
      value={{
        students,
        schools,
        followUps,
        currentSchool,
        currentClass,
        loading,
        refreshData,
        addStudent,
        updateToothRecord,
        batchUpdateToothRecords,
        setCurrentSchool,
        setCurrentClass,
        getStudentById,
        deleteStudent,
        updateStudent,
        addSchool,
        addClassToSchool,
        getFollowUpByStudent,
        upsertFollowUp,
        batchUpsertFollowUps,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = (): AppContextType => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
