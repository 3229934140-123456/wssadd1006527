import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Input, Button, ScrollView, Picker } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import classnames from 'classnames'
import { useApp } from '@/store/AppContext'
import { mockSchools } from '@/data/mockData'
import StudentCard from '@/components/StudentCard'
import { Student } from '@/types'
import styles from './index.module.scss'

const RegisterPage: React.FC = () => {
  const { students, currentSchool, currentClass, setCurrentSchool, setCurrentClass, addStudent, refreshData, loading } = useApp()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSchoolPicker, setShowSchoolPicker] = useState(false)
  const [showClassPicker, setShowClassPicker] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male' as 'male' | 'female',
    guardianPhone: '',
    age: '',
  })

  useEffect(() => {
    refreshData()
  }, [])

  useDidShow(() => {
    refreshData()
  })

  usePullDownRefresh(() => {
    refreshData()
    setTimeout(() => {
      Taro.stopPullDownRefresh()
    }, 500)
  })

  const filteredStudents = useMemo(() => {
    let result = [...students]

    if (currentSchool) {
      result = result.filter(s => s.school === currentSchool)
    }
    if (currentClass) {
      result = result.filter(s => s.className === currentClass)
    }
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(keyword) ||
        s.className.toLowerCase().includes(keyword) ||
        s.guardianPhone.includes(keyword)
      )
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [students, currentSchool, currentClass, searchKeyword])

  const availableClasses = useMemo(() => {
    const school = mockSchools.find(s => s.name === currentSchool)
    return school?.classes || []
  }, [currentSchool])

  const handleScan = async () => {
    try {
      const res = await Taro.scanCode({
        scanType: ['qrCode', 'barCode'],
        success: (res) => {
          console.log('[Register] Scan result:', res.result)
          try {
            const data = JSON.parse(res.result)
            if (Array.isArray(data)) {
              data.forEach(item => {
                addStudent({
                  name: item.name,
                  className: item.className || currentClass,
                  school: item.school || currentSchool,
                  guardianPhone: item.guardianPhone || '',
                  gender: item.gender || 'male',
                  age: item.age,
                })
              })
              Taro.showToast({ title: `成功导入${data.length}名学生`, icon: 'success' })
            } else {
              addStudent({
                name: data.name,
                className: data.className || currentClass,
                school: data.school || currentSchool,
                guardianPhone: data.guardianPhone || '',
                gender: data.gender || 'male',
                age: data.age,
              })
              Taro.showToast({ title: '添加成功', icon: 'success' })
            }
          } catch (e) {
            console.error('[Register] Parse QR code error:', e)
            Taro.showToast({ title: '二维码格式错误', icon: 'error' })
          }
        }
      })
    } catch (e) {
      console.error('[Register] Scan error:', e)
      Taro.showToast({ title: '扫码失败', icon: 'error' })
    }
  }

  const handleAddStudent = () => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入学生姓名', icon: 'none' })
      return
    }
    if (!formData.guardianPhone.trim()) {
      Taro.showToast({ title: '请输入监护人电话', icon: 'none' })
      return
    }
    if (!currentSchool) {
      Taro.showToast({ title: '请选择学校', icon: 'none' })
      return
    }
    if (!currentClass) {
      Taro.showToast({ title: '请选择班级', icon: 'none' })
      return
    }

    addStudent({
      name: formData.name.trim(),
      className: currentClass,
      school: currentSchool,
      guardianPhone: formData.guardianPhone.trim(),
      gender: formData.gender,
      age: formData.age ? parseInt(formData.age) : undefined,
    })

    setFormData({ name: '', gender: 'male', guardianPhone: '', age: '' })
    setShowAddModal(false)
    Taro.showToast({ title: '添加成功', icon: 'success' })
  }

  const handleStudentClick = (student: Student) => {
    Taro.navigateTo({
      url: `/pages/student-detail/index?id=${student.id}`,
    })
  }

  const handleSchoolSelect = (school: string) => {
    setCurrentSchool(school)
    setCurrentClass('')
    setShowSchoolPicker(false)
  }

  const handleClassSelect = (cls: string) => {
    setCurrentClass(cls)
    setShowClassPicker(false)
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>扫码建档</Text>
        <Text className={styles.headerSubtitle}>快速录入学生信息，高效完成窝沟封闭登记</Text>
      </View>

      <View className={styles.filterSection}>
        <View className={styles.filterRow}>
          <View className={styles.filterItem} onClick={() => setShowSchoolPicker(true)}>
            <View>
              <Text className={styles.filterLabel}>学校</Text>
              <Text className={styles.filterValue}>{currentSchool || '请选择'}</Text>
            </View>
            <Text className={styles.filterArrow}>›</Text>
          </View>
          <View className={styles.filterItem} onClick={() => setShowClassPicker(true)}>
            <View>
              <Text className={styles.filterLabel}>班级</Text>
              <Text className={styles.filterValue}>{currentClass || '请选择'}</Text>
            </View>
            <Text className={styles.filterArrow}>›</Text>
          </View>
        </View>

        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索学生姓名、班级..."
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.listSection}>
        <View className={styles.listHeader}>
          <Text className={styles.listTitle}>学生列表</Text>
          <Text className={styles.listCount}>共 {filteredStudents.length} 人</Text>
        </View>

        <ScrollView scrollY style={{ height: 'calc(100vh - 600rpx)' }}>
          {loading ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>⏳</Text>
              <Text className={styles.emptyText}>加载中...</Text>
            </View>
          ) : filteredStudents.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📋</Text>
              <Text className={styles.emptyText}>暂无学生信息</Text>
              <Text className={styles.emptyHint}>点击下方"扫码"或"手动录入"添加</Text>
            </View>
          ) : (
            filteredStudents.map(student => (
              <StudentCard
                key={student.id}
                student={student}
                onClick={() => handleStudentClick(student)}
              />
            ))
          )}
        </ScrollView>
      </View>

      <View className={styles.bottomBar}>
        <Button className={classnames(styles.actionBtn, styles.scanBtn)} onClick={handleScan}>
          <Text className={styles.btnIcon}>📷</Text>
          <Text className={styles.btnText}>扫码建档</Text>
        </Button>
        <Button className={classnames(styles.actionBtn, styles.manualBtn)} onClick={() => setShowAddModal(true)}>
          <Text className={styles.btnIcon}>✏️</Text>
          <Text className={styles.btnText}>手动录入</Text>
        </Button>
      </View>

      {showAddModal && (
        <View className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>手动录入学生信息</Text>
            </View>
            <View className={styles.modalBody}>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>学生姓名 *</Text>
                <Input
                  className={styles.formInput}
                  placeholder="请输入学生姓名"
                  value={formData.name}
                  onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
                />
              </View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>性别</Text>
                <View className={styles.genderRow}>
                  <View
                    className={classnames(styles.genderOption, formData.gender === 'male' && styles.active)}
                    onClick={() => setFormData({ ...formData, gender: 'male' })}
                  >
                    <Text className={styles.genderIcon}>👦</Text>
                    <Text className={styles.genderText}>男</Text>
                  </View>
                  <View
                    className={classnames(styles.genderOption, formData.gender === 'female' && styles.active)}
                    onClick={() => setFormData({ ...formData, gender: 'female' })}
                  >
                    <Text className={styles.genderIcon}>👧</Text>
                    <Text className={styles.genderText}>女</Text>
                  </View>
                </View>
              </View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>年龄</Text>
                <Input
                  className={styles.formInput}
                  type="number"
                  placeholder="请输入年龄（选填）"
                  value={formData.age}
                  onInput={(e) => setFormData({ ...formData, age: e.detail.value })}
                />
              </View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>监护人电话 *</Text>
                <Input
                  className={styles.formInput}
                  type="number"
                  placeholder="请输入监护人手机号"
                  value={formData.guardianPhone}
                  onInput={(e) => setFormData({ ...formData, guardianPhone: e.detail.value })}
                />
              </View>
            </View>
            <View className={styles.modalActions}>
              <Button className={classnames(styles.modalBtn, styles.modalCancel)} onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button className={classnames(styles.modalBtn, styles.modalConfirm)} onClick={handleAddStudent}>
                确认添加
              </Button>
            </View>
          </View>
        </View>
      )}

      {showSchoolPicker && (
        <View className={styles.modalOverlay} onClick={() => setShowSchoolPicker(false)}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择学校</Text>
            </View>
            <View className={styles.modalBody} style={{ maxHeight: '60vh', overflowY: 'auto', padding: 0 }}>
              {mockSchools.map(school => (
                <View
                  key={school.id}
                  className={classnames(styles.pickerOption, currentSchool === school.name && styles.active)}
                  onClick={() => handleSchoolSelect(school.name)}
                >
                  <Text>{school.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {showClassPicker && (
        <View className={styles.modalOverlay} onClick={() => setShowClassPicker(false)}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择班级</Text>
            </View>
            <View className={styles.modalBody} style={{ maxHeight: '60vh', overflowY: 'auto', padding: 0 }}>
              {availableClasses.length === 0 ? (
                <View className={styles.pickerOption}>
                  <Text className={styles.formLabel} style={{ color: '$color-text-tertiary' }}>请先选择学校</Text>
                </View>
              ) : (
                availableClasses.map(cls => (
                  <View
                    key={cls}
                    className={classnames(styles.pickerOption, currentClass === cls && styles.active)}
                    onClick={() => handleClassSelect(cls)}
                  >
                    <Text>{cls}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default RegisterPage
