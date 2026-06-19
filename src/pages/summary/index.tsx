import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Button, ScrollView, Input } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import classnames from 'classnames'
import { useApp } from '@/store/AppContext'
import StatusTag from '@/components/StatusTag'
import { Student, FollowUpStatus, FOLLOWUP_LABEL } from '@/types'
import styles from './index.module.scss'

type StudentStatus = 'done' | 'followup' | 'unchecked'
type FollowUpFilter = FollowUpStatus | 'all'

const SummaryPage: React.FC = () => {
  const { students, schools, currentSchool, currentClass, setCurrentSchool, setCurrentClass,
    refreshData, loading, getFollowUpByStudent, upsertFollowUp } = useApp()

  const [activeTab, setActiveTab] = useState<'completion' | 'followup'>('completion')
  const [expandedClasses, setExpandedClasses] = useState<string[]>([])
  const [showSchoolPicker, setShowSchoolPicker] = useState(false)
  const [showClassPicker, setShowClassPicker] = useState(false)
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>('all')
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [followUpForm, setFollowUpForm] = useState({
    status: 'pending' as FollowUpStatus,
    remark: '',
    appointmentTime: '',
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
    if (currentSchool) result = result.filter(s => s.school === currentSchool)
    if (currentClass) result = result.filter(s => s.className === currentClass)
    return result
  }, [students, currentSchool, currentClass])

  const getStudentStatus = (student: Student): StudentStatus => {
    const hasSuggest = student.toothRecords.some(r => r.status === 'suggest')
    const hasDelay = student.toothRecords.some(r => r.status === 'delay')
    const hasDone = student.toothRecords.some(r => r.status === 'done')
    if (hasSuggest || hasDelay) return 'followup'
    if (hasDone) return 'done'
    return 'unchecked'
  }

  const stats = useMemo(() => {
    const total = filteredStudents.length
    const completed = filteredStudents.filter(s => getStudentStatus(s) === 'done').length
    const followup = filteredStudents.filter(s => getStudentStatus(s) === 'followup').length
    const unchecked = filteredStudents.filter(s => getStudentStatus(s) === 'unchecked').length
    const suggestCount = filteredStudents.reduce((sum, s) =>
      sum + s.toothRecords.filter(r => r.status === 'suggest').length, 0
    )
    const doneCount = filteredStudents.reduce((sum, s) =>
      sum + s.toothRecords.filter(r => r.status === 'done').length, 0
    )
    const delayCount = filteredStudents.reduce((sum, s) =>
      sum + s.toothRecords.filter(r => r.status === 'delay').length, 0
    )
    return { total, completed, followup, unchecked, suggestCount, doneCount, delayCount }
  }, [filteredStudents])

  const classSummaries = useMemo(() => {
    const classMap = new Map<string, Student[]>()
    filteredStudents.forEach(s => {
      if (!classMap.has(s.className)) classMap.set(s.className, [])
      classMap.get(s.className)!.push(s)
    })
    return Array.from(classMap.entries()).map(([className, students]) => {
      const total = students.length
      const completed = students.filter(s => getStudentStatus(s) === 'done').length
      const followup = students.filter(s => getStudentStatus(s) === 'followup').length
      const unchecked = students.filter(s => getStudentStatus(s) === 'unchecked').length
      return {
        className,
        total,
        completed,
        followup,
        unchecked,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        students,
      }
    }).sort((a, b) => a.className.localeCompare(b.className))
  }, [filteredStudents])

  const followUpList = useMemo(() => {
    let list = filteredStudents.filter(s => getStudentStatus(s) === 'followup')

    if (followUpFilter !== 'all') {
      list = list.filter(s => {
        const record = getFollowUpByStudent(s.id)
        return record?.status === followUpFilter
      })
    }

    return list.map(student => {
      const suggestTeeth = student.toothRecords.filter(r => r.status === 'suggest').map(r => r.toothName)
      const delayTeeth = student.toothRecords.filter(r => r.status === 'delay').map(r => r.toothName)
      const followUp = getFollowUpByStudent(student.id)
      return { student, suggestTeeth, delayTeeth, followUp }
    })
  }, [filteredStudents, followUpFilter, getFollowUpByStudent])

  const availableClasses = useMemo(() => {
    const school = schools.find(s => s.name === currentSchool)
    return school?.classes || []
  }, [schools, currentSchool])

  const todayDate = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  }, [])

  const toggleClassExpand = (className: string) => {
    setExpandedClasses(prev =>
      prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]
    )
  }

  const handleCallPhone = (phone: string) => {
    Taro.makePhoneCall({ phoneNumber: phone })
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (currentSchool) params.append('school', currentSchool)
    if (currentClass) params.append('class', currentClass)
    if (followUpFilter !== 'all') params.append('followup', followUpFilter)
    const url = `/pages/export-preview/index${params.toString() ? `?${params.toString()}` : ''}`
    Taro.navigateTo({ url })
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

  const openFollowUpModal = (studentId: string) => {
    const record = getFollowUpByStudent(studentId)
    setSelectedStudentId(studentId)
    setFollowUpForm({
      status: record?.status || 'pending',
      remark: record?.remark || '',
      appointmentTime: record?.appointmentTime || '',
    })
    setShowFollowUpModal(true)
  }

  const handleFollowUpSave = () => {
    if (!selectedStudentId) return
    upsertFollowUp(selectedStudentId, {
      status: followUpForm.status,
      remark: followUpForm.remark || undefined,
      appointmentTime: followUpForm.appointmentTime || undefined,
    })
    setShowFollowUpModal(false)
    Taro.showToast({ title: '已保存', icon: 'success' })
  }

  const getStudentStatusTag = (student: Student) => {
    const status = getStudentStatus(student)
    if (status === 'done') return <StatusTag status="done" size="small" />
    if (status === 'followup') {
      const hasSuggest = student.toothRecords.some(r => r.status === 'suggest')
      return <StatusTag status={hasSuggest ? 'suggest' : 'delay'} size="small" />
    }
    return <View className={styles.uncheckedTag}><Text>未检查</Text></View>
  }

  const followUpFilterOptions: { value: FollowUpFilter; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待通知' },
    { value: 'notified', label: '已通知' },
    { value: 'appointed', label: '已预约' },
    { value: 'declined', label: '已拒绝' },
    { value: 'transferred', label: '已转诊' },
  ]

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>汇总交接</Text>
        <Text className={styles.headerDate}>{todayDate}</Text>
      </View>

      <View className={styles.statsGrid}>
        <View className={classnames(styles.statCard, styles.primary)} onClick={() => setActiveTab('completion')}>
          <Text className={styles.statValue}>{stats.total}</Text>
          <Text className={styles.statLabel}>总人数</Text>
        </View>
        <View className={classnames(styles.statCard, styles.success)} onClick={() => setActiveTab('completion')}>
          <Text className={styles.statValue}>{stats.completed}</Text>
          <Text className={styles.statLabel}>已完成</Text>
        </View>
        <View className={classnames(styles.statCard, styles.warning)} onClick={() => setActiveTab('followup')}>
          <Text className={styles.statValue}>{stats.followup}</Text>
          <Text className={styles.statLabel}>需复诊</Text>
        </View>
        <View className={classnames(styles.statCard, styles.info)}>
          <Text className={styles.statValue}>{stats.unchecked}</Text>
          <Text className={styles.statLabel}>未检查</Text>
        </View>
        <View className={classnames(styles.statCard, styles.secondary)}>
          <Text className={styles.statValue}>{stats.suggestCount}</Text>
          <Text className={styles.statLabel}>建议封闭</Text>
        </View>
        <View className={classnames(styles.statCard, styles.default)}>
          <Text className={styles.statValue}>{stats.doneCount}</Text>
          <Text className={styles.statLabel}>已封闭</Text>
        </View>
        <View className={classnames(styles.statCard, styles.gray)}>
          <Text className={styles.statValue}>{stats.delayCount}</Text>
          <Text className={styles.statLabel}>暂缓处理</Text>
        </View>
      </View>

      <View className={styles.filterSection}>
        <View className={styles.filterRow}>
          <View className={styles.filterItem} onClick={() => setShowSchoolPicker(true)}>
            <View>
              <Text className={styles.filterLabel}>学校</Text>
              <Text className={styles.filterValue}>{currentSchool || '全部'}</Text>
            </View>
            <Text className={styles.filterArrow}>›</Text>
          </View>
          <View className={styles.filterItem} onClick={() => setShowClassPicker(true)}>
            <View>
              <Text className={styles.filterLabel}>班级</Text>
              <Text className={styles.filterValue}>{currentClass || '全部'}</Text>
            </View>
            <Text className={styles.filterArrow}>›</Text>
          </View>
        </View>
        <Button className={styles.exportBtn} onClick={handleExport}>
          <Text className={styles.exportBtnIcon}>📤</Text>
          <Text>导出工作报告</Text>
        </Button>
      </View>

      <View className={styles.tabSection}>
        <View className={styles.tabHeader}>
          <View
            className={classnames(styles.tabItem, activeTab === 'completion' && styles.active)}
            onClick={() => setActiveTab('completion')}
          >
            <Text className={styles.tabText}>完成情况</Text>
          </View>
          <View
            className={classnames(styles.tabItem, activeTab === 'followup' && styles.active)}
            onClick={() => setActiveTab('followup')}
          >
            <Text className={styles.tabText}>需复诊名单</Text>
          </View>
        </View>

        {activeTab === 'followup' && (
          <ScrollView scrollX className={styles.followUpFilterBar}>
            {followUpFilterOptions.map(opt => (
              <View
                key={opt.value}
                className={classnames(styles.followUpFilterBtn, followUpFilter === opt.value && styles.filterActive)}
                onClick={() => setFollowUpFilter(opt.value)}
              >
                <Text>{opt.label}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <ScrollView scrollY style={{ height: activeTab === 'followup' ? 'calc(100vh - 860rpx)' : 'calc(100vh - 780rpx)' }}>
          {activeTab === 'completion' ? (
            <View className={styles.listSection}>
              {classSummaries.length === 0 ? (
                <View className={styles.emptyState}>
                  <Text className={styles.emptyIcon}>📊</Text>
                  <Text className={styles.emptyText}>暂无数据</Text>
                  <Text className={styles.emptyHint}>请先在"扫码建档"添加学生</Text>
                </View>
              ) : (
                classSummaries.map(cls => (
                  <View key={cls.className} className={styles.classItem}>
                    <View className={styles.classHeader} onClick={() => toggleClassExpand(cls.className)}>
                      <Text className={styles.className}>{cls.className}</Text>
                      <View className={styles.classProgress}>
                        <View className={styles.progressBar}>
                          <View className={styles.progressFill} style={{ width: `${cls.percent}%` }} />
                        </View>
                        <Text className={styles.classCount}>{cls.completed}/{cls.total}</Text>
                      </View>
                      <Text className={classnames(styles.expandIcon, expandedClasses.includes(cls.className) && styles.expanded)}>
                        ▾
                      </Text>
                    </View>
                    {expandedClasses.includes(cls.className) && (
                      <View className={styles.studentList}>
                        {cls.students.map(student => {
                          const status = getStudentStatus(student)
                          const statusText = status === 'done' ? '已完成' : status === 'followup' ? '需复诊' : '未检查'
                          return (
                            <View
                              key={student.id}
                              className={styles.studentMiniItem}
                              onClick={() => Taro.navigateTo({
                                url: `/pages/student-detail/index?id=${student.id}`,
                              })}
                            >
                              <View className={styles.studentMiniAvatar}>
                                <Text className={styles.studentMiniAvatarText}>{student.name.charAt(0)}</Text>
                              </View>
                              <View className={styles.studentMiniInfo}>
                                <Text className={styles.studentMiniName}>{student.name}</Text>
                                <Text className={styles.studentMiniDetail}>
                                  {statusText}
                                  {student.toothRecords.length > 0 && ` · ${student.toothRecords.length}颗牙`}
                                </Text>
                              </View>
                              {getStudentStatusTag(student)}
                            </View>
                          )
                        })}
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          ) : (
            <View className={styles.listSection}>
              {followUpList.length === 0 ? (
                <View className={styles.emptyState}>
                  <Text className={styles.emptyIcon}>✅</Text>
                  <Text className={styles.emptyText}>暂无需要复诊的学生</Text>
                </View>
              ) : (
                followUpList.map((item, index) => (
                  <View key={item.student.id} className={styles.followUpItem}>
                    <View className={styles.followUpAvatar}>
                      <Text className={styles.followUpAvatarText}>{index + 1}</Text>
                    </View>
                    <View
                      className={styles.followUpInfo}
                      onClick={() => Taro.navigateTo({ url: `/pages/student-detail/index?id=${item.student.id}` })}
                    >
                      <View className={styles.followUpName}>
                        <Text>{item.student.name}</Text>
                        {item.suggestTeeth.length > 0 && <StatusTag status="suggest" size="small" />}
                        {item.delayTeeth.length > 0 && <StatusTag status="delay" size="small" />}
                      </View>
                      <Text className={styles.followUpClass}>{item.student.className}</Text>
                      <Text className={styles.followUpTeeth}>
                        {item.suggestTeeth.length > 0 && `建议封闭：${item.suggestTeeth.join('、')} `}
                        {item.delayTeeth.length > 0 && `暂缓处理：${item.delayTeeth.join('、')}`}
                      </Text>
                      {item.followUp && (
                        <View className={styles.followUpStatusRow}>
                          <View className={classnames(styles.followUpBadge, styles[item.followUp.status])}>
                            <Text>{FOLLOWUP_LABEL[item.followUp.status]}</Text>
                          </View>
                          {item.followUp.appointmentTime && (
                            <Text className={styles.followUpAppointment}>
                              预约：{item.followUp.appointmentTime}
                            </Text>
                          )}
                          {item.followUp.remark && (
                            <Text className={styles.followUpRemark}>
                              备注：{item.followUp.remark}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'column', gap: '8rpx', alignItems: 'flex-end' }}>
                      <View
                        className={styles.followUpPhone}
                        onClick={() => handleCallPhone(item.student.guardianPhone)}
                      >
                        <Text className={styles.followUpPhoneText}>📞</Text>
                      </View>
                      <View
                        className={styles.followUpBtn}
                        onClick={(e) => { e.stopPropagation(); openFollowUpModal(item.student.id) }}
                      >
                        <Text className={styles.followUpBtnText}>回访</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {showSchoolPicker && (
        <View className={styles.modalOverlay} onClick={() => setShowSchoolPicker(false)}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择学校</Text>
              <View className={styles.modalClose} onClick={() => setShowSchoolPicker(false)}>
                <Text className={styles.modalCloseText}>×</Text>
              </View>
            </View>
            <View className={styles.modalBody} style={{ padding: 0, maxHeight: '60vh' }}>
              <View
                className={classnames(styles.pickerOption, !currentSchool && styles.active)}
                onClick={() => handleSchoolSelect('')}
              >
                <Text>全部学校</Text>
              </View>
              {schools.map(school => (
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
              <View className={styles.modalClose} onClick={() => setShowClassPicker(false)}>
                <Text className={styles.modalCloseText}>×</Text>
              </View>
            </View>
            <View className={styles.modalBody} style={{ padding: 0, maxHeight: '60vh' }}>
              <View
                className={classnames(styles.pickerOption, !currentClass && styles.active)}
                onClick={() => handleClassSelect('')}
              >
                <Text>全部班级</Text>
              </View>
              {availableClasses.length === 0 ? (
                <View className={styles.pickerOption}>
                  <Text style={{ color: '#86909c' }}>请先选择学校</Text>
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

      {showFollowUpModal && (
        <View className={styles.modalOverlay} onClick={() => setShowFollowUpModal(false)}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>回访登记</Text>
            </View>
            <View className={styles.modalBody}>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>回访状态</Text>
                <View className={styles.statusOptionGrid}>
                  {(['pending', 'notified', 'appointed', 'declined', 'transferred'] as FollowUpStatus[]).map(status => (
                    <View
                      key={status}
                      className={classnames(styles.statusOption, followUpForm.status === status && styles.statusOptionActive, styles[status])}
                      onClick={() => setFollowUpForm({ ...followUpForm, status })}
                    >
                      <Text>{FOLLOWUP_LABEL[status]}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>预约时间（选填）</Text>
                <Input
                  className={styles.formInput}
                  placeholder="例：2026-06-25 上午"
                  value={followUpForm.appointmentTime}
                  onInput={(e) => setFollowUpForm({ ...followUpForm, appointmentTime: e.detail.value })}
                />
              </View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>备注（选填）</Text>
                <Input
                  className={styles.formInput}
                  placeholder="记录沟通结果、家长意见等"
                  value={followUpForm.remark}
                  onInput={(e) => setFollowUpForm({ ...followUpForm, remark: e.detail.value })}
                />
              </View>
            </View>
            <View className={styles.modalActions}>
              <Button className={classnames(styles.modalBtn, styles.modalCancel)} onClick={() => setShowFollowUpModal(false)}>
                取消
              </Button>
              <Button className={classnames(styles.modalBtn, styles.modalConfirm)} onClick={handleFollowUpSave}>
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default SummaryPage
