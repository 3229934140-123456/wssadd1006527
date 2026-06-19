import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import classnames from 'classnames'
import { useApp } from '@/store/AppContext'
import { mockSchools } from '@/data/mockData'
import StatusTag from '@/components/StatusTag'
import { Student } from '@/types'
import styles from './index.module.scss'

const SummaryPage: React.FC = () => {
  const { students, currentSchool, currentClass, setCurrentSchool, setCurrentClass, refreshData, loading } = useApp()
  const [activeTab, setActiveTab] = useState<'completion' | 'followup'>('completion')
  const [expandedClasses, setExpandedClasses] = useState<string[]>([])
  const [showSchoolPicker, setShowSchoolPicker] = useState(false)
  const [showClassPicker, setShowClassPicker] = useState(false)

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

    return result
  }, [students, currentSchool, currentClass])

  const stats = useMemo(() => {
    const total = filteredStudents.length
    const completed = filteredStudents.filter(s =>
      s.toothRecords.some(r => r.status === 'done')
    ).length
    const pending = total - completed
    const suggestCount = filteredStudents.reduce((sum, s) =>
      sum + s.toothRecords.filter(r => r.status === 'suggest').length, 0
    )
    const doneCount = filteredStudents.reduce((sum, s) =>
      sum + s.toothRecords.filter(r => r.status === 'done').length, 0
    )
    const delayCount = filteredStudents.reduce((sum, s) =>
      sum + s.toothRecords.filter(r => r.status === 'delay').length, 0
    )

    return { total, completed, pending, suggestCount, doneCount, delayCount }
  }, [filteredStudents])

  const classSummaries = useMemo(() => {
    const classMap = new Map<string, Student[]>()
    filteredStudents.forEach(s => {
      if (!classMap.has(s.className)) {
        classMap.set(s.className, [])
      }
      classMap.get(s.className)!.push(s)
    })

    return Array.from(classMap.entries()).map(([className, students]) => {
      const total = students.length
      const completed = students.filter(s =>
        s.toothRecords.some(r => r.status === 'done')
      ).length
      return {
        className,
        total,
        completed,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        students,
      }
    }).sort((a, b) => a.className.localeCompare(b.className))
  }, [filteredStudents])

  const followUpList = useMemo(() => {
    return filteredStudents.filter(s =>
      s.toothRecords.some(r => r.status === 'suggest' || r.status === 'delay')
    ).map(student => {
      const suggestTeeth = student.toothRecords
        .filter(r => r.status === 'suggest')
        .map(r => r.toothName)
      const delayTeeth = student.toothRecords
        .filter(r => r.status === 'delay')
        .map(r => r.toothName)
      return {
        student,
        suggestTeeth,
        delayTeeth,
      }
    })
  }, [filteredStudents])

  const availableClasses = useMemo(() => {
    const school = mockSchools.find(s => s.name === currentSchool)
    return school?.classes || []
  }, [currentSchool])

  const todayDate = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  }, [])

  const toggleClassExpand = (className: string) => {
    setExpandedClasses(prev =>
      prev.includes(className)
        ? prev.filter(c => c !== className)
        : [...prev, className]
    )
  }

  const handleCallPhone = (phone: string) => {
    Taro.makePhoneCall({ phoneNumber: phone })
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (currentSchool) params.append('school', currentSchool)
    if (currentClass) params.append('class', currentClass)
    const url = `/pages/export-preview/index${params.toString() ? `?${params.toString()}` : ''}`
    Taro.navigateTo({ url })
    console.log('[Summary] Navigate to export preview')
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

  const getStudentStatusText = (student: Student) => {
    const hasDone = student.toothRecords.some(r => r.status === 'done')
    const hasSuggest = student.toothRecords.some(r => r.status === 'suggest')
    const hasDelay = student.toothRecords.some(r => r.status === 'delay')

    if (hasDone) return '已完成'
    if (hasSuggest || hasDelay) return '需复诊'
    return '未检查'
  }

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
          <Text className={styles.statValue}>{stats.pending}</Text>
          <Text className={styles.statLabel}>未完成</Text>
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

        <ScrollView scrollY style={{ height: 'calc(100vh - 780rpx)' }}>
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
                        {cls.students.map(student => (
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
                                {getStudentStatusText(student)} · {student.toothRecords.length}颗牙
                              </Text>
                            </View>
                            <StatusTag
                              status={student.toothRecords.find(r => r.status === 'done') ? 'done' :
                                      student.toothRecords.find(r => r.status === 'suggest') ? 'suggest' : 'delay'}
                              size="small"
                            />
                          </View>
                        ))}
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
                  <Text className={styles.emptyHint}>所有学生均已完成封闭</Text>
                </View>
              ) : (
                followUpList.map((item, index) => (
                  <View key={item.student.id} className={styles.followUpItem}>
                    <View className={styles.followUpAvatar}>
                      <Text className={styles.followUpAvatarText}>{index + 1}</Text>
                    </View>
                    <View className={styles.followUpInfo}>
                      <View className={styles.followUpName}>
                        <Text>{item.student.name}</Text>
                        {item.suggestTeeth.length > 0 && (
                          <StatusTag status="suggest" size="small" />
                        )}
                        {item.delayTeeth.length > 0 && (
                          <StatusTag status="delay" size="small" />
                        )}
                      </View>
                      <Text className={styles.followUpClass}>{item.student.className}</Text>
                      <Text className={styles.followUpTeeth}>
                        {item.suggestTeeth.length > 0 && `建议封闭：${item.suggestTeeth.join('、')} `}
                        {item.delayTeeth.length > 0 && `暂缓处理：${item.delayTeeth.join('、')}`}
                      </Text>
                    </View>
                    <View
                      className={styles.followUpPhone}
                      onClick={() => handleCallPhone(item.student.guardianPhone)}
                    >
                      <Text className={styles.followUpPhoneText}>📞</Text>
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
    </View>
  )
}

export default SummaryPage
