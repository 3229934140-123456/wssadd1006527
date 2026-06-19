import React, { useState, useMemo } from 'react'
import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { useApp } from '@/store/AppContext'
import { Student, STATUS_LABEL, COOPERATION_LABEL, ToothRecord } from '@/types'
import StatusTag from '@/components/StatusTag'
import styles from './index.module.scss'

const StudentDetailPage: React.FC = () => {
  const router = useRouter()
  const studentId = router.params.id
  const { getStudentById, deleteStudent, updateStudent } = useApp()

  const [student, setStudent] = useState<Student | undefined>()
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    gender: 'male' as 'male' | 'female',
    age: '',
    guardianPhone: '',
    className: '',
    school: '',
  })

  useDidShow(() => {
    if (studentId) {
      const data = getStudentById(studentId)
      setStudent(data)
      if (data) {
        setEditForm({
          name: data.name,
          gender: data.gender,
          age: data.age?.toString() || '',
          guardianPhone: data.guardianPhone,
          className: data.className,
          school: data.school,
        })
      }
    }
  })

  const stats = useMemo(() => {
    if (!student) return { suggest: 0, done: 0, delay: 0 }
    return student.toothRecords.reduce(
      (acc, record) => {
        acc[record.status]++
        return acc
      },
      { suggest: 0, done: 0, delay: 0 }
    )
  }, [student])

  const sortedRecords = useMemo(() => {
    if (!student) return []
    return [...student.toothRecords].sort(
      (a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
    )
  }, [student])

  const handleCall = () => {
    if (student?.guardianPhone) {
      Taro.makePhoneCall({
        phoneNumber: student.guardianPhone,
      })
    }
  }

  const handleGoToTreatment = () => {
    if (studentId) {
      Taro.switchTab({
        url: '/pages/treatment/index',
      })
    }
  }

  const handleDelete = () => {
    if (!studentId) return
    Taro.showModal({
      title: '确认删除',
      content: '删除后该学生的所有记录将无法恢复，确定删除吗？',
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm) {
          deleteStudent(studentId)
          Taro.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => {
            Taro.navigateBack()
          }, 500)
        }
      },
    })
  }

  const handleOpenEdit = () => {
    setShowEditModal(true)
  }

  const handleCloseEdit = () => {
    setShowEditModal(false)
  }

  const handleEditSubmit = () => {
    if (!student || !editForm.name.trim()) {
      Taro.showToast({ title: '请填写姓名', icon: 'error' })
      return
    }

    const updatedStudent: Student = {
      ...student,
      name: editForm.name.trim(),
      gender: editForm.gender,
      age: editForm.age ? parseInt(editForm.age) : undefined,
      guardianPhone: editForm.guardianPhone.trim(),
      className: editForm.className.trim(),
      school: editForm.school.trim(),
      updatedAt: new Date().toISOString(),
    }

    updateStudent(updatedStudent)
    setStudent(updatedStudent)
    setShowEditModal(false)
    Taro.showToast({ title: '保存成功', icon: 'success' })
  }

  const handleRecordClick = (record: ToothRecord) => {
    Taro.showModal({
      title: `${record.toothName} - ${record.toothName}`,
      content: formatRecordDetail(record),
      showCancel: false,
      confirmText: '关闭',
    })
  }

  const formatRecordDetail = (record: ToothRecord): string => {
    const lines = [`状态：${STATUS_LABEL[record.status]}`]
    if (record.materialBatch) {
      lines.push(`材料批号：${record.materialBatch}`)
    }
    if (record.doctorSignature) {
      lines.push(`医生签名：${record.doctorSignature}`)
    }
    if (record.cooperation) {
      lines.push(`配合度：${COOPERATION_LABEL[record.cooperation]}`)
    }
    lines.push(`更新时间：${formatTime(record.updateTime)}`)
    return lines.join('\n')
  }

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }

  if (!student) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>学生信息不存在</Text>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY enhanced showScrollbar={false}>
        <View className={styles.header}>
          <View className={styles.studentInfo}>
            <View className={styles.avatar}>
              <Text className={styles.avatarText}>{student.name.charAt(0)}</Text>
            </View>
            <View className={styles.info}>
              <View className={styles.nameRow}>
                <Text className={styles.name}>{student.name}</Text>
                <View className={styles.genderTag}>
                  <Text>{student.gender === 'male' ? '男' : '女'}</Text>
                </View>
                {student.age && (
                  <View className={styles.ageTag}>
                    <Text>{student.age}岁</Text>
                  </View>
                )}
              </View>
              <Text className={styles.schoolClass}>
                {student.school} {student.className}
              </Text>
              <View className={styles.phone}>
                <Text className={styles.phoneIcon}>📞</Text>
                <Text>{student.guardianPhone || '未填写电话'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionTitleText}>检查统计</Text>
            <Button className={styles.editBtn} onClick={handleOpenEdit}>
              编辑信息
            </Button>
          </View>
          <View className={styles.statsRow}>
            <View className={classnames(styles.statCard, styles.suggest)}>
              <Text className={styles.statValue}>{stats.suggest}</Text>
              <Text className={styles.statLabel}>建议封闭</Text>
            </View>
            <View className={classnames(styles.statCard, styles.done)}>
              <Text className={styles.statValue}>{stats.done}</Text>
              <Text className={styles.statLabel}>已封闭</Text>
            </View>
            <View className={classnames(styles.statCard, styles.delay)}>
              <Text className={styles.statValue}>{stats.delay}</Text>
              <Text className={styles.statLabel}>暂缓处理</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionTitleText}>
              牙位记录 ({sortedRecords.length})
            </Text>
          </View>
          {sortedRecords.length === 0 ? (
            <View className={styles.emptyRecord}>
              <Text className={styles.emptyRecordIcon}>🦷</Text>
              <Text className={styles.emptyRecordText}>暂无牙位记录</Text>
            </View>
          ) : (
            <View className={styles.recordList}>
              {sortedRecords.map((record) => (
                <View
                  key={record.toothId}
                  className={styles.recordItem}
                  onClick={() => handleRecordClick(record)}
                >
                  <View className={classnames(styles.toothBadge, styles[record.status])}>
                    <Text>{record.toothName}</Text>
                  </View>
                  <View className={styles.recordInfo}>
                    <View className={styles.recordToothName}>
                      <Text>{record.toothName}</Text>
                      <StatusTag status={record.status} size="small" />
                    </View>
                    {record.materialBatch && (
                      <Text className={styles.recordDetail}>
                        材料批号：{record.materialBatch}
                      </Text>
                    )}
                    {record.doctorSignature && (
                      <Text className={styles.recordDetail}>
                        医生：{record.doctorSignature}
                      </Text>
                    )}
                    {record.cooperation && (
                      <Text className={styles.recordDetail}>
                        配合度：{COOPERATION_LABEL[record.cooperation]}
                      </Text>
                    )}
                    <Text className={styles.recordTime}>
                      {formatTime(record.updateTime)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: '200rpx' }} />
      </ScrollView>

      <View className={styles.actionBar}>
        <Button className={classnames(styles.actionBtn, styles.callBtn)} onClick={handleCall}>
          <Text className={styles.btnIcon}>📞</Text>
          <Text>拨打电话</Text>
        </Button>
        <Button
          className={classnames(styles.actionBtn, styles.treatmentBtn)}
          onClick={handleGoToTreatment}
        >
          <Text className={styles.btnIcon}>🦷</Text>
          <Text>前往治疗</Text>
        </Button>
        <Button className={classnames(styles.actionBtn, styles.deleteBtn)} onClick={handleDelete}>
          <Text className={styles.btnIcon}>🗑️</Text>
          <Text>删除</Text>
        </Button>
      </View>

      {showEditModal && (
        <View className={styles.modalOverlay} onClick={handleCloseEdit}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>编辑学生信息</Text>
            </View>
            <View className={styles.modalBody}>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>姓名</Text>
                <Input
                  className={styles.formInput}
                  placeholder="请输入学生姓名"
                  value={editForm.name}
                  onInput={(e) => setEditForm({ ...editForm, name: e.detail.value })}
                />
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>性别</Text>
                <View className={styles.genderRow}>
                  <View
                    className={classnames(styles.genderOption, editForm.gender === 'male' && styles.active)}
                    onClick={() => setEditForm({ ...editForm, gender: 'male' })}
                  >
                    <Text className={styles.genderIcon}>👦</Text>
                    <Text className={styles.genderText}>男</Text>
                  </View>
                  <View
                    className={classnames(styles.genderOption, editForm.gender === 'female' && styles.active)}
                    onClick={() => setEditForm({ ...editForm, gender: 'female' })}
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
                  placeholder="请输入年龄"
                  value={editForm.age}
                  onInput={(e) => setEditForm({ ...editForm, age: e.detail.value })}
                />
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>监护人电话</Text>
                <Input
                  className={styles.formInput}
                  type="phone"
                  placeholder="请输入监护人电话"
                  value={editForm.guardianPhone}
                  onInput={(e) => setEditForm({ ...editForm, guardianPhone: e.detail.value })}
                />
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>学校</Text>
                <Input
                  className={styles.formInput}
                  placeholder="请输入学校名称"
                  value={editForm.school}
                  onInput={(e) => setEditForm({ ...editForm, school: e.detail.value })}
                />
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>班级</Text>
                <Input
                  className={styles.formInput}
                  placeholder="请输入班级"
                  value={editForm.className}
                  onInput={(e) => setEditForm({ ...editForm, className: e.detail.value })}
                />
              </View>
            </View>
            <View className={styles.modalActions}>
              <Button className={classnames(styles.modalBtn, styles.modalCancel)} onClick={handleCloseEdit}>
                取消
              </Button>
              <Button className={classnames(styles.modalBtn, styles.modalConfirm)} onClick={handleEditSubmit}>
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default StudentDetailPage
