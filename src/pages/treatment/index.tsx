import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import classnames from 'classnames'
import { useApp } from '@/store/AppContext'
import ToothChart from '@/components/ToothChart'
import StatusTag from '@/components/StatusTag'
import { Student, ToothRecord, TreatmentStatus, COOPERATION_LABEL } from '@/types'
import { formatDate } from '@/utils/storage'
import styles from './index.module.scss'

const TreatmentPage: React.FC = () => {
  const { students, currentSchool, currentClass, updateToothRecord, refreshData, loading } = useApp()
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
  const [showStudentList, setShowStudentList] = useState(false)

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

    return result.sort((a, b) => {
      const aHasRecord = a.toothRecords.length > 0
      const bHasRecord = b.toothRecords.length > 0
      if (aHasRecord && !bHasRecord) return 1
      if (!aHasRecord && bHasRecord) return -1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [students, currentSchool, currentClass])

  const currentStudent: Student | undefined = filteredStudents[currentStudentIndex]

  const progress = useMemo(() => {
    if (!currentStudent) return { completed: 0, total: 8, percent: 0 }
    const molars = ['16', '17', '26', '27', '36', '37', '46', '47']
    const completed = currentStudent.toothRecords.filter(r =>
      molars.includes(r.toothId) && r.status === 'done'
    ).length
    return {
      completed,
      total: molars.length,
      percent: Math.round((completed / molars.length) * 100),
    }
  }, [currentStudent])

  const handleToothClick = (toothId: string, status: TreatmentStatus, extra?: Partial<ToothRecord>) => {
    if (!currentStudent) return
    updateToothRecord(currentStudent.id, toothId, status, extra)
  }

  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1)
    } else {
      Taro.showToast({ title: '已经是第一个', icon: 'none' })
    }
  }

  const handleNextStudent = () => {
    if (currentStudentIndex < filteredStudents.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1)
    } else {
      Taro.showToast({ title: '已经是最后一个', icon: 'none' })
    }
  }

  const handleSelectStudent = (index: number) => {
    setCurrentStudentIndex(index)
    setShowStudentList(false)
  }

  const getStudentStatus = (student: Student) => {
    if (student.toothRecords.length === 0) return 'empty'
    const hasDone = student.toothRecords.some(r => r.status === 'done')
    const hasSuggest = student.toothRecords.some(r => r.status === 'suggest')
    if (hasDone) return 'completed'
    if (hasSuggest) return 'pending'
    return 'empty'
  }

  const getRecordDetail = (record: ToothRecord) => {
    const parts: string[] = []
    if (record.materialBatch) parts.push(`批号:${record.materialBatch}`)
    if (record.doctorSignature) parts.push(`医生:${record.doctorSignature}`)
    if (record.cooperation) parts.push(`配合:${COOPERATION_LABEL[record.cooperation]}`)
    parts.push(formatDate(record.updateTime))
    return parts.join(' | ')
  }

  if (loading && filteredStudents.length === 0) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyRecord}>
          <Text className={styles.emptyRecordIcon}>⏳</Text>
          <Text className={styles.emptyRecordText}>加载中...</Text>
        </View>
      </View>
    )
  }

  if (filteredStudents.length === 0) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyRecord} style={{ paddingTop: '200rpx' }}>
          <Text className={styles.emptyRecordIcon}>📋</Text>
          <Text className={styles.emptyRecordText}>暂无学生数据</Text>
          <Text className={styles.emptyRecordText} style={{ fontSize: '24rpx', marginTop: '16rpx' }}>
            请先在"扫码建档"页面添加学生
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.studentSelector}>
        <View className={styles.studentCard}>
          <View className={styles.navArrow} onClick={handlePrevStudent}>
            <Text className={styles.navArrowText}>‹</Text>
          </View>

          <View className={styles.studentAvatar}>
            <Text className={styles.studentAvatarText}>{currentStudent?.name.charAt(0)}</Text>
          </View>

          <View className={styles.studentInfo}>
            <View className={styles.studentNameRow}>
              <Text className={styles.studentName}>{currentStudent?.name}</Text>
              <Text className={styles.studentGender}>
                {currentStudent?.gender === 'male' ? '男' : '女'}
              </Text>
              {currentStudent?.age && (
                <Text className={styles.studentGender}>{currentStudent.age}岁</Text>
              )}
            </View>
            <Text className={styles.studentClass}>
              {currentStudent?.school} · {currentStudent?.className}
            </Text>
            <View className={styles.progressBar}>
              <View className={styles.progressFill} style={{ width: `${progress.percent}%` }} />
            </View>
            <Text className={styles.progressText}>
              窝沟封闭完成度：{progress.completed}/{progress.total} ({progress.percent}%)
            </Text>
          </View>

          <View className={styles.navArrow} onClick={handleNextStudent}>
            <Text className={styles.navArrowText}>›</Text>
          </View>
        </View>

        <View className={styles.switchStudentBtn} onClick={() => setShowStudentList(true)}>
          <Text className={styles.switchStudentText}>
            切换学生 ({currentStudentIndex + 1}/{filteredStudents.length})
          </Text>
        </View>
      </View>

      <View className={styles.chartSection}>
        {currentStudent && (
          <ToothChart
            records={currentStudent.toothRecords}
            onToothClick={handleToothClick}
          />
        )}
      </View>

      <View className={styles.summarySection}>
        <Text className={styles.summaryTitle}>检查记录</Text>
        <View className={styles.recordList}>
          {currentStudent?.toothRecords.length === 0 ? (
            <View className={styles.emptyRecord}>
              <Text className={styles.emptyRecordIcon}>🦷</Text>
              <Text className={styles.emptyRecordText}>暂无牙位记录</Text>
              <Text className={styles.emptyRecordText} style={{ fontSize: '24rpx', marginTop: '8rpx' }}>
                点击上方牙位按钮开始检查
              </Text>
            </View>
          ) : (
            currentStudent?.toothRecords.map(record => (
              <View key={record.toothId} className={styles.recordItem}>
                <View className={classnames(styles.toothBadge, styles[record.status])}>
                  <Text>{record.toothName}</Text>
                </View>
                <View className={styles.recordInfo}>
                  <Text className={styles.recordToothName}>{record.toothName} 牙位</Text>
                  <Text className={styles.recordDetail}>{getRecordDetail(record)}</Text>
                </View>
                <View className={styles.recordStatus}>
                  <StatusTag status={record.status} size="small" />
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {showStudentList && (
        <View className={styles.studentListModal} onClick={() => setShowStudentList(false)}>
          <View className={styles.studentListContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.studentListHeader}>
              <Text className={styles.studentListTitle}>选择学生</Text>
              <View className={styles.closeBtn} onClick={() => setShowStudentList(false)}>
                <Text className={styles.closeBtnText}>×</Text>
              </View>
            </View>
            <ScrollView className={styles.studentListBody} scrollY>
              {filteredStudents.map((student, index) => (
                <View
                  key={student.id}
                  className={classnames(styles.studentListItem, currentStudentIndex === index && styles.active)}
                  onClick={() => handleSelectStudent(index)}
                >
                  <View className={styles.listItemAvatar}>
                    <Text className={styles.listItemAvatarText}>{student.name.charAt(0)}</Text>
                  </View>
                  <View className={styles.listItemInfo}>
                    <Text className={styles.listItemName}>{student.name}</Text>
                    <Text className={styles.listItemClass}>
                      {student.className} · {student.toothRecords.length}颗牙已记录
                    </Text>
                  </View>
                  <View className={styles.listItemStatus}>
                    <View className={classnames(styles.statusDot, styles[getStudentStatus(student)])} />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}

export default TreatmentPage
