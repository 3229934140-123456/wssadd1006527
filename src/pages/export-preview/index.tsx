import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { useApp } from '@/store/AppContext'
import { Student, STATUS_LABEL, COOPERATION_LABEL } from '@/types'
import styles from './index.module.scss'

interface FollowUpItem {
  student: Student
  suggestTeeth: string[]
  delayTeeth: string[]
}

interface ClassSummary {
  className: string
  total: number
  completed: number
  pending: number
  suggestCount: number
  doneCount: number
  delayCount: number
  percent: number
  students: Student[]
}

interface SchoolSummary {
  schoolName: string
  total: number
  completed: number
  pending: number
  classes: ClassSummary[]
}

const ExportPreviewPage: React.FC = () => {
  const router = useRouter()
  const { students } = useApp()

  const [viewMode, setViewMode] = useState<'visual' | 'text'>('visual')
  const [reportContent, setReportContent] = useState('')

  const filterSchool = router.params.school || ''
  const filterClass = router.params.class || ''

  useDidShow(() => {
    const report = generateExportReport()
    setReportContent(report)
  })

  const todayDate = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  }, [])

  const filteredStudents = useMemo(() => {
    let result = [...students]
    if (filterSchool) {
      result = result.filter(s => s.school === filterSchool)
    }
    if (filterClass) {
      result = result.filter(s => s.className === filterClass)
    }
    return result
  }, [students, filterSchool, filterClass])

  const stats = useMemo(() => {
    const total = filteredStudents.length
    const completed = filteredStudents.filter(s =>
      s.toothRecords.some(r => r.status === 'done')
    ).length
    const pending = total - completed

    let suggestCount = 0
    let doneCount = 0
    let delayCount = 0
    filteredStudents.forEach(s => {
      s.toothRecords.forEach(r => {
        if (r.status === 'suggest') suggestCount++
        else if (r.status === 'done') doneCount++
        else if (r.status === 'delay') delayCount++
      })
    })

    return { total, completed, pending, suggestCount, doneCount, delayCount }
  }, [filteredStudents])

  const schoolSummaries = useMemo((): SchoolSummary[] => {
    const schoolMap = new Map<string, Student[]>()
    filteredStudents.forEach(student => {
      if (!schoolMap.has(student.school)) {
        schoolMap.set(student.school, [])
      }
      schoolMap.get(student.school)!.push(student)
    })

    const summaries: SchoolSummary[] = []
    schoolMap.forEach((schoolStudents, schoolName) => {
      const classMap = new Map<string, Student[]>()
      schoolStudents.forEach(student => {
        if (!classMap.has(student.className)) {
          classMap.set(student.className, [])
        }
        classMap.get(student.className)!.push(student)
      })

      const classes: ClassSummary[] = []
      let schoolTotal = 0
      let schoolCompleted = 0

      classMap.forEach((classStudents, className) => {
        const total = classStudents.length
        const completed = classStudents.filter(s =>
          s.toothRecords.some(r => r.status === 'done')
        ).length
        const pending = total - completed
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0

        let suggestCount = 0
        let doneCount = 0
        let delayCount = 0
        classStudents.forEach(s => {
          s.toothRecords.forEach(r => {
            if (r.status === 'suggest') suggestCount++
            else if (r.status === 'done') doneCount++
            else if (r.status === 'delay') delayCount++
          })
        })

        classes.push({
          className,
          total,
          completed,
          pending,
          suggestCount,
          doneCount,
          delayCount,
          percent,
          students: classStudents,
        })

        schoolTotal += total
        schoolCompleted += completed
      })

      classes.sort((a, b) => a.className.localeCompare(b.className))

      summaries.push({
        schoolName,
        total: schoolTotal,
        completed: schoolCompleted,
        pending: schoolTotal - schoolCompleted,
        classes,
      })
    })

    return summaries.sort((a, b) => a.schoolName.localeCompare(b.schoolName))
  }, [filteredStudents])

  const followUpList = useMemo((): FollowUpItem[] => {
    return filteredStudents
      .filter(s =>
        s.toothRecords.some(r => r.status === 'suggest' || r.status === 'delay')
      )
      .map(student => {
        const suggestTeeth = student.toothRecords
          .filter(r => r.status === 'suggest')
          .map(r => r.toothName)
        const delayTeeth = student.toothRecords
          .filter(r => r.status === 'delay')
          .map(r => r.toothName)
        return { student, suggestTeeth, delayTeeth }
      })
      .sort((a, b) => {
        if (a.student.className !== b.student.className) {
          return a.student.className.localeCompare(b.student.className)
        }
        return a.student.name.localeCompare(b.student.name)
      })
  }, [filteredStudents])

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }

  const generateExportReport = (): string => {
    let report = `【窝沟封闭筛查工作报告】\n`
    report += `生成时间：${todayDate}\n`
    if (filterSchool) report += `学校：${filterSchool}\n`
    if (filterClass) report += `班级：${filterClass}\n`
    report += `\n`
    report += `=== 今日统计 ===\n`
    report += `筛查学生总数：${stats.total}人\n`
    report += `已完成封闭：${stats.completed}人\n`
    report += `未完成：${stats.pending}人\n`
    report += `建议封闭牙位数：${stats.suggestCount}颗\n`
    report += `已封闭牙位数：${stats.doneCount}颗\n`
    report += `暂缓处理牙位数：${stats.delayCount}颗\n`
    report += `\n`

    report += `=== 各校/各班完成情况 ===\n`
    schoolSummaries.forEach(school => {
      report += `【${school.schoolName}】 ${school.completed}/${school.total}人\n`
      school.classes.forEach(cls => {
        report += `  ${cls.className}：${cls.completed}/${cls.total}人（${cls.percent}%）\n`
        report += `    建议封闭${cls.suggestCount}颗、已封闭${cls.doneCount}颗、暂缓${cls.delayCount}颗\n`
      })
      report += `\n`
    })

    report += `=== 需复诊名单（${followUpList.length}人）===\n`
    followUpList.forEach((item, index) => {
      const { student, suggestTeeth, delayTeeth } = item
      report += `${index + 1}. ${student.name}（${student.className}）\n`
      report += `   家长电话：${student.guardianPhone}\n`
      if (suggestTeeth.length > 0) {
        report += `   建议封闭：${suggestTeeth.join('、')}牙位\n`
      }
      if (delayTeeth.length > 0) {
        report += `   暂缓处理：${delayTeeth.join('、')}牙位\n`
      }

      const doneRecords = student.toothRecords.filter(r => r.status === 'done')
      if (doneRecords.length > 0) {
        report += `   已封闭：${doneRecords.map(r =>
          `${r.toothName}（${r.materialBatch || '无批号'}, ${r.doctorSignature || '无签名'}, ${COOPERATION_LABEL[r.cooperation || 'good']}）`
        ).join('、')}\n`
      }
      report += `\n`
    })

    report += `=== 详细完成记录 ===\n`
    filteredStudents.forEach(student => {
      if (student.toothRecords.length > 0) {
        report += `${student.name}（${student.className}）：\n`
        student.toothRecords.forEach(record => {
          report += `  ${record.toothName}牙位 - ${STATUS_LABEL[record.status]}`
          if (record.materialBatch) report += `，材料：${record.materialBatch}`
          if (record.doctorSignature) report += `，医生：${record.doctorSignature}`
          if (record.cooperation) report += `，配合度：${COOPERATION_LABEL[record.cooperation]}`
          report += `，时间：${formatDate(record.updateTime)}\n`
        })
        report += `\n`
      }
    })

    return report
  }

  const handleCopy = async () => {
    try {
      await Taro.setClipboardData({ data: reportContent })
      Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
    } catch (e) {
      console.error('[ExportPreview] Copy error:', e)
      Taro.showToast({ title: '复制失败', icon: 'error' })
    }
  }

  const handleShare = () => {
    Taro.showShareMenu({
      withShareTicket: true,
    })
    Taro.showToast({ title: '请点击右上角分享', icon: 'none' })
  }

  const handleStudentClick = (studentId: string) => {
    Taro.navigateTo({
      url: `/pages/student-detail/index?id=${studentId}`,
    })
  }

  const handleCallPhone = (phone: string) => {
    if (phone) {
      Taro.makePhoneCall({ phoneNumber: phone })
    }
  }

  if (students.length === 0) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📊</Text>
          <Text className={styles.emptyText}>暂无数据</Text>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY enhanced showScrollbar={false}>
        <View className={styles.header}>
          <Text className={styles.title}>窝沟封闭筛查工作报告</Text>
          <Text className={styles.subtitle}>
            生成时间：{todayDate}
            {filterSchool && ` · ${filterSchool}`}
            {filterClass && ` · ${filterClass}`}
          </Text>
        </View>

        <View className={styles.section}>
          <View className={styles.viewToggle}>
            <Button
              className={classnames(styles.toggleBtn, viewMode === 'visual' && styles.active)}
              onClick={() => setViewMode('visual')}
            >
              可视化视图
            </Button>
            <Button
              className={classnames(styles.toggleBtn, viewMode === 'text' && styles.active)}
              onClick={() => setViewMode('text')}
            >
              文本报告
            </Button>
          </View>
        </View>

        {viewMode === 'visual' ? (
          <>
            <View className={styles.section}>
              <View className={styles.sectionTitle}>
                <Text className={styles.sectionTitleIcon}>📈</Text>
                <Text className={styles.sectionTitleText}>总体统计</Text>
              </View>
              <View className={styles.overviewCard}>
                <View className={styles.overviewRow}>
                  <View className={classnames(styles.overviewItem, styles.primary)}>
                    <Text className={styles.overviewValue}>{stats.total}</Text>
                    <Text className={styles.overviewLabel}>总人数</Text>
                  </View>
                  <View className={classnames(styles.overviewItem, styles.done)}>
                    <Text className={styles.overviewValue}>{stats.completed}</Text>
                    <Text className={styles.overviewLabel}>已完成</Text>
                  </View>
                </View>
                <View className={styles.overviewRow}>
                  <View className={classnames(styles.overviewItem, styles.suggest)}>
                    <Text className={styles.overviewValue}>{stats.suggestCount}</Text>
                    <Text className={styles.overviewLabel}>建议封闭(颗)</Text>
                  </View>
                  <View className={classnames(styles.overviewItem, styles.done)}>
                    <Text className={styles.overviewValue}>{stats.doneCount}</Text>
                    <Text className={styles.overviewLabel}>已封闭(颗)</Text>
                  </View>
                  <View className={classnames(styles.overviewItem, styles.delay)}>
                    <Text className={styles.overviewValue}>{stats.delayCount}</Text>
                    <Text className={styles.overviewLabel}>暂缓处理(颗)</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className={styles.section}>
              <View className={styles.sectionTitle}>
                <Text className={styles.sectionTitleIcon}>🏫</Text>
                <Text className={styles.sectionTitleText}>各校完成情况</Text>
              </View>
              {schoolSummaries.map(school => (
                <View key={school.schoolName} className={styles.schoolSection}>
                  <View className={styles.schoolHeader}>
                    <Text className={styles.schoolName}>{school.schoolName}</Text>
                    <Text className={styles.schoolStats}>
                      {school.completed}/{school.total}人
                    </Text>
                  </View>
                  <View className={styles.classList}>
                    {school.classes.map(cls => (
                      <View key={cls.className} className={styles.classItem}>
                        <View className={styles.classHeader}>
                          <Text className={styles.className}>{cls.className}</Text>
                          <Text className={styles.classProgress}>
                            {cls.percent}% ({cls.completed}/{cls.total})
                          </Text>
                        </View>
                        <View className={styles.progressBar}>
                          <View
                            className={styles.progressFill}
                            style={{ width: `${cls.percent}%` }}
                          />
                        </View>
                        <View className={styles.classDetail}>
                          <View className={styles.detailItem}>
                            <View className={classnames(styles.detailDot, styles.suggest)} />
                            <Text>建议{cls.suggestCount}</Text>
                          </View>
                          <View className={styles.detailItem}>
                            <View className={classnames(styles.detailDot, styles.done)} />
                            <Text>已封{cls.doneCount}</Text>
                          </View>
                          <View className={styles.detailItem}>
                            <View className={classnames(styles.detailDot, styles.delay)} />
                            <Text>暂缓{cls.delayCount}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <View className={styles.section}>
              <View className={styles.sectionTitle}>
                <Text className={styles.sectionTitleIcon}>📋</Text>
                <Text className={styles.sectionTitleText}>需复诊名单</Text>
              </View>
              <View className={styles.followUpSection}>
                <View className={styles.followUpHeader}>
                  <Text className={styles.followUpTitle}>需联系家长</Text>
                  <View className={styles.followUpCount}>
                    <Text>{followUpList.length}人</Text>
                  </View>
                </View>
                {followUpList.length === 0 ? (
                  <View className={styles.emptyState} style={{ padding: '80rpx 0' }}>
                    <Text className={styles.emptyIcon}>✅</Text>
                    <Text className={styles.emptyText}>暂无需复诊学生</Text>
                  </View>
                ) : (
                  <View className={styles.followUpList}>
                    {followUpList.map((item, index) => (
                      <View
                        key={item.student.id}
                        className={styles.followUpItem}
                        onClick={() => handleStudentClick(item.student.id)}
                      >
                        <View className={styles.followUpAvatar}>
                          <Text className={styles.followUpAvatarText}>
                            {item.student.name.charAt(0)}
                          </Text>
                        </View>
                        <View className={styles.followUpInfo}>
                          <Text className={styles.followUpName}>
                            {index + 1}. {item.student.name}
                          </Text>
                          <Text className={styles.followUpClass}>
                            {item.student.className}
                          </Text>
                          {item.suggestTeeth.length > 0 && (
                            <Text className={styles.followUpTeeth}>
                              建议封闭：{item.suggestTeeth.join('、')}
                            </Text>
                          )}
                          {item.delayTeeth.length > 0 && (
                            <Text className={styles.followUpTeeth}>
                              暂缓处理：{item.delayTeeth.join('、')}
                            </Text>
                          )}
                        </View>
                        <View
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCallPhone(item.student.guardianPhone)
                          }}
                        >
                          <Text className={styles.followUpPhone}>
                            <Text className={styles.followUpPhoneIcon}>📞</Text>
                            {item.student.guardianPhone || '无电话'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </>
        ) : (
          <View className={styles.section}>
            <View className={styles.reportContent}>
              {reportContent.split('\n').map((line, index) => (
                <Text key={index} className={styles.reportLine}>
                  {line || '\n'}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: '200rpx' }} />
      </ScrollView>

      <View className={styles.actionBar}>
        <Button className={classnames(styles.actionBtn, styles.copyBtn)} onClick={handleCopy}>
          <Text className={styles.btnIcon}>📋</Text>
          <Text>复制报告</Text>
        </Button>
        <Button className={classnames(styles.actionBtn, styles.shareBtn)} onClick={handleShare}>
          <Text className={styles.btnIcon}>📤</Text>
          <Text>分享</Text>
        </Button>
      </View>
    </View>
  )
}

export default ExportPreviewPage
