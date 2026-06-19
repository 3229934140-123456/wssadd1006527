import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import { Student } from '@/types'
import { formatDate } from '@/utils/storage'
import styles from './index.module.scss'

interface StudentCardProps {
  student: Student
  selected?: boolean
  onClick?: () => void
  showStatus?: boolean
}

const StudentCard: React.FC<StudentCardProps> = ({ student, selected, onClick, showStatus = true }) => {
  const getStatusSummary = () => {
    const { toothRecords } = student
    if (toothRecords.length === 0) return null

    const counts = {
      suggest: toothRecords.filter(r => r.status === 'suggest').length,
      done: toothRecords.filter(r => r.status === 'done').length,
      delay: toothRecords.filter(r => r.status === 'delay').length,
    }

    return counts
  }

  const counts = getStatusSummary()
  const hasRecords = counts && (counts.suggest > 0 || counts.done > 0 || counts.delay > 0)

  return (
    <View
      className={classnames(styles.card, selected && styles.selected)}
      onClick={onClick}
    >
      <View className={styles.header}>
        <View className={styles.avatar}>
          <Text className={styles.avatarText}>{student.name.charAt(0)}</Text>
        </View>
        <View className={styles.info}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{student.name}</Text>
            <Text className={styles.gender}>{student.gender === 'male' ? '男' : '女'}</Text>
            {student.age && <Text className={styles.age}>{student.age}岁</Text>}
          </View>
          <Text className={styles.classInfo}>{student.school} · {student.className}</Text>
        </View>
        <View className={styles.arrow}>
          <Text className={styles.arrowText}>›</Text>
        </View>
      </View>

      {showStatus && hasRecords && counts && (
        <View className={styles.statusRow}>
          {counts.done > 0 && (
            <View className={styles.statusItem}>
              <View className={classnames(styles.dot, styles.dotDone)} />
              <Text className={styles.statusText}>已封闭 {counts.done}</Text>
            </View>
          )}
          {counts.suggest > 0 && (
            <View className={styles.statusItem}>
              <View className={classnames(styles.dot, styles.dotSuggest)} />
              <Text className={styles.statusText}>建议 {counts.suggest}</Text>
            </View>
          )}
          {counts.delay > 0 && (
            <View className={styles.statusItem}>
              <View className={classnames(styles.dot, styles.dotDelay)} />
              <Text className={styles.statusText}>暂缓 {counts.delay}</Text>
            </View>
          )}
        </View>
      )}

      <View className={styles.footer}>
        <Text className={styles.phone}>📞 {student.guardianPhone}</Text>
        <Text className={styles.time}>{formatDate(student.updatedAt)}</Text>
      </View>
    </View>
  )
}

export default StudentCard
