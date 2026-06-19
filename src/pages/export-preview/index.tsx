import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { useApp } from '@/store/AppContext'
import { Student, STATUS_LABEL, COOPERATION_LABEL, FOLLOWUP_LABEL, FollowUpStatus } from '@/types'
import styles from './index.module.scss'

type ReportVersion = 'school' | 'internal'
type StudentStatus = 'done' | 'followup' | 'unchecked'

interface ClassSummary {
  className: string
  total: number
  completed: number
  followup: number
  unchecked: number
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
  followup: number
  unchecked: number
  classes: ClassSummary[]
}

const ExportPreviewPage: React.FC = () => {
  const router = useRouter()
  const { students, getFollowUpByStudent } = useApp()

  const [viewMode, setViewMode] = useState<'visual' | 'text'>('visual')
  const [reportVersion, setReportVersion] = useState<ReportVersion>('school')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpStatus | 'all'>('all')
  const [reportContent, setReportContent] = useState('')

  const filterSchool = router.params.school || ''
  const filterClass = router.params.class || ''
  const paramFollowUp = router.params.followup || ''

  useEffect(() => {
    if (paramFollowUp) {
      setFollowUpFilter(paramFollowUp as FollowUpStatus)
    }
  }, [paramFollowUp])

  useDidShow(() => {
    const report = generateExportReport()
    setReportContent(report)
  })

  const todayDate = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  }, [])

  const getStudentStatus = (student: Student): StudentStatus => {
    const hasSuggest = student.toothRecords.some(r => r.status === 'suggest')
    const hasDelay = student.toothRecords.some(r => r.status === 'delay')
    const hasDone = student.toothRecords.some(r => r.status === 'done')
    if (hasSuggest || hasDelay) return 'followup'
    if (hasDone) return 'done'
    return 'unchecked'
  }

  const allDoctors = useMemo(() => {
    const doctors = new Set<string>()
    students.forEach(s => {
      s.toothRecords.forEach(r => {
        if (r.doctorSignature) doctors.add(r.doctorSignature)
      })
    })
    return Array.from(doctors).sort()
  }, [students])

  const filteredStudents = useMemo(() => {
    let result = [...students]
    if (filterSchool) result = result.filter(s => s.school === filterSchool)
    if (filterClass) result = result.filter(s => s.className === filterClass)
    if (doctorFilter) {
      result = result.filter(s =>
        s.toothRecords.some(r => r.doctorSignature === doctorFilter)
      )
    }
    if (followUpFilter !== 'all') {
      result = result.filter(s => {
        const fu = getFollowUpByStudent(s.id)
        return fu?.status === followUpFilter
      })
    }
    return result
  }, [students, filterSchool, filterClass, doctorFilter, followUpFilter, getFollowUpByStudent])

  const stats = useMemo(() => {
    const total = filteredStudents.length
    const completed = filteredStudents.filter(s => getStudentStatus(s) === 'done').length
    const followup = filteredStudents.filter(s => getStudentStatus(s) === 'followup').length
    const unchecked = filteredStudents.filter(s => getStudentStatus(s) === 'unchecked').length
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
    return { total, completed, followup, unchecked, suggestCount, doneCount, delayCount }
  }, [filteredStudents])

  const schoolSummaries = useMemo((): SchoolSummary[] => {
    const schoolMap = new Map<string, Student[]>()
    filteredStudents.forEach(student => {
      if (!schoolMap.has(student.school)) schoolMap.set(student.school, [])
      schoolMap.get(student.school)!.push(student)
    })

    const summaries: SchoolSummary[] = []
    schoolMap.forEach((schoolStudents, schoolName) => {
      const classMap = new Map<string, Student[]>()
      schoolStudents.forEach(student => {
        if (!classMap.has(student.className)) classMap.set(student.className, [])
        classMap.get(student.className)!.push(student)
      })

      const classes: ClassSummary[] = []
      let schoolTotal = 0
      let schoolCompleted = 0
      let schoolFollowup = 0
      let schoolUnchecked = 0

      classMap.forEach((classStudents, className) => {
        const total = classStudents.length
        const completed = classStudents.filter(s => getStudentStatus(s) === 'done').length
        const followup = classStudents.filter(s => getStudentStatus(s) === 'followup').length
        const unchecked = classStudents.filter(s => getStudentStatus(s) === 'unchecked').length
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

        classes.push({ className, total, completed, followup, unchecked, suggestCount, doneCount, delayCount, percent, students: classStudents })
        schoolTotal += total
        schoolCompleted += completed
        schoolFollowup += followup
        schoolUnchecked += unchecked
      })

      classes.sort((a, b) => a.className.localeCompare(b.className))
      summaries.push({ schoolName, total: schoolTotal, completed: schoolCompleted, followup: schoolFollowup, unchecked: schoolUnchecked, classes })
    })

    return summaries.sort((a, b) => a.schoolName.localeCompare(b.schoolName))
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
    const versionLabel = reportVersion === 'school' ? '学校负责人版' : '团队内部版'

    let report = `【窝沟封闭筛查工作报告 - ${versionLabel}】\n`
    report += `生成时间：${todayDate}\n`
    if (filterSchool) report += `学校筛选：${filterSchool}\n`
    if (filterClass) report += `班级筛选：${filterClass}\n`
    if (doctorFilter) report += `医生筛选：${doctorFilter}\n`
    if (followUpFilter !== 'all') report += `回访状态：${FOLLOWUP_LABEL[followUpFilter as FollowUpStatus]}\n`
    report += `\n`

    report += `=== 今日统计 ===\n`
    report += `筛查学生总数：${stats.total}人\n`
    report += `已完成封闭：${stats.completed}人\n`
    report += `需复诊（建议/暂缓）：${stats.followup}人\n`
    report += `未检查：${stats.unchecked}人\n`
    report += `\n`

    if (reportVersion === 'internal') {
      report += `建议封闭牙位数：${stats.suggestCount}颗\n`
      report += `已封闭牙位数：${stats.doneCount}颗\n`
      report += `暂缓处理牙位数：${stats.delayCount}颗\n`
      report += `\n`
    }

    report += `=== 各校/各班完成情况 ===\n`
    schoolSummaries.forEach(school => {
      report += `【${school.schoolName}】 已完成${school.completed}/${school.total}人（需复诊${school.followup}人、未检查${school.unchecked}人）\n`
      school.classes.forEach(cls => {
        report += `  ${cls.className}：已完成${cls.completed}/${cls.total}人（${cls.percent}%），需复诊${cls.followup}人、未检查${cls.unchecked}人\n`
      })
      report += `\n`
    })

    report += `=== 各班未检查名单 ===\n`
    let hasUnchecked = false
    schoolSummaries.forEach(school => {
      school.classes.forEach(cls => {
        const uncheckedStudents = cls.students.filter(s => getStudentStatus(s) === 'unchecked')
        if (uncheckedStudents.length > 0) {
          hasUnchecked = true
          report += `${school.schoolName} ${cls.className}（${uncheckedStudents.length}人）：\n`
          uncheckedStudents.forEach(s => {
            report += `  ${s.name}（家长电话：${s.guardianPhone}）\n`
          })
        }
      })
    })
    if (!hasUnchecked) report += `（全部已检查）\n`
    report += `\n`

    report += `=== 各班需复诊名单 ===\n`
    let hasFollowup = false
    schoolSummaries.forEach(school => {
      school.classes.forEach(cls => {
        const followupStudents = cls.students.filter(s => getStudentStatus(s) === 'followup')
        if (followupStudents.length > 0) {
          hasFollowup = true
          report += `${school.schoolName} ${cls.className}（${followupStudents.length}人）：\n`
          followupStudents.forEach(student => {
            const suggestTeeth = student.toothRecords.filter(r => r.status === 'suggest').map(r => r.toothName)
            const delayTeeth = student.toothRecords.filter(r => r.status === 'delay').map(r => r.toothName)
            const fu = getFollowUpByStudent(student.id)
            report += `  ${student.name}（家长电话：${student.guardianPhone}）\n`
            if (suggestTeeth.length > 0) report += `    建议封闭：${suggestTeeth.join('、')}\n`
            if (delayTeeth.length > 0) report += `    暂缓处理：${delayTeeth.join('、')}\n`
            if (fu) {
              report += `    回访状态：${FOLLOWUP_LABEL[fu.status]}`
              if (fu.appointmentTime) report += `，预约：${fu.appointmentTime}`
              report += `\n`
              if (fu.remark) report += `    备注：${fu.remark}\n`
            } else {
              report += `    回访状态：待通知\n`
            }
          })
        }
      })
    })
    if (!hasFollowup) report += `（无需复诊学生）\n`
    report += `\n`

    if (reportVersion === 'internal') {
      if (allDoctors.length > 0) {
        report += `=== 医生工作量统计 ===\n`
        const doctorScopeStudents = doctorFilter
          ? filteredStudents
          : students.filter(s => filterSchool ? s.school === filterSchool : true).filter(s => filterClass ? s.className === filterClass : true)

        allDoctors.forEach(doctor => {
          if (doctorFilter && doctor !== doctorFilter) return
          const doctorStudents = doctorScopeStudents.filter(s =>
            s.toothRecords.some(r => r.doctorSignature === doctor)
          )
          const doctorDoneCount = doctorScopeStudents.reduce((sum, s) =>
            sum + s.toothRecords.filter(r => r.doctorSignature === doctor && r.status === 'done').length, 0
          )
          report += `${doctor}：检查${doctorStudents.length}人，已封闭${doctorDoneCount}颗牙\n`
        })
        report += `\n`
      }

      report += `=== 详细牙位记录 ===\n`
      filteredStudents.forEach(student => {
        if (student.toothRecords.length > 0) {
          report += `${student.name}（${student.school} ${student.className}）：\n`
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
    }

    return report
  }

  useEffect(() => {
    const report = generateExportReport()
    setReportContent(report)
  }, [reportVersion, doctorFilter, followUpFilter])

  const handleCopy = async () => {
    try {
      await Taro.setClipboardData({ data: reportContent })
      Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
    } catch (e) {
      Taro.showToast({ title: '复制失败', icon: 'error' })
    }
  }

  const handleShare = () => {
    Taro.showShareMenu({ withShareTicket: true })
    Taro.showToast({ title: '请点击右上角分享', icon: 'none' })
  }

  const handleStudentClick = (studentId: string) => {
    Taro.navigateTo({ url: `/pages/student-detail/index?id=${studentId}` })
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
            {todayDate}
            {filterSchool && ` · ${filterSchool}`}
            {filterClass && ` · ${filterClass}`}
            {doctorFilter && ` · ${doctorFilter}医生`}
            {followUpFilter !== 'all' && ` · ${FOLLOWUP_LABEL[followUpFilter as FollowUpStatus]}`}
          </Text>
        </View>

        <View className={styles.section}>
          <View className={styles.versionToggle}>
            <View
              className={classnames(styles.versionBtn, reportVersion === 'school' && styles.active)}
              onClick={() => setReportVersion('school')}
            >
              <Text className={styles.versionIcon}>🏫</Text>
              <Text className={styles.versionText}>学校负责人版</Text>
            </View>
            <View
              className={classnames(styles.versionBtn, reportVersion === 'internal' && styles.active)}
              onClick={() => setReportVersion('internal')}
            >
              <Text className={styles.versionIcon}>📋</Text>
              <Text className={styles.versionText}>团队内部版</Text>
            </View>
          </View>
        </View>

        {reportVersion === 'internal' && allDoctors.length > 0 && (
          <View className={styles.section}>
            <View className={styles.doctorFilter}>
              <Text className={styles.doctorFilterLabel}>医生筛选：</Text>
              <View className={styles.doctorFilterBtns}>
                <View
                  className={classnames(styles.doctorBtn, !doctorFilter && styles.doctorBtnActive)}
                  onClick={() => setDoctorFilter('')}
                >
                  <Text>全部</Text>
                </View>
                {allDoctors.map(doctor => (
                  <View
                    key={doctor}
                    className={classnames(styles.doctorBtn, doctorFilter === doctor && styles.doctorBtnActive)}
                    onClick={() => setDoctorFilter(doctor)}
                  >
                    <Text>{doctor}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.followUpFilterBar}>
            <Text className={styles.filterLabel}>回访状态：</Text>
            <ScrollView scrollX className={styles.followUpScroll}>
              {(['all', 'pending', 'notified', 'appointed', 'declined', 'transferred'] as const).map(status => (
                <View
                  key={status}
                  className={classnames(styles.followUpBtn, followUpFilter === status && styles.active)}
                  onClick={() => setFollowUpFilter(status)}
                >
                  <Text>{status === 'all' ? '全部' : FOLLOWUP_LABEL[status]}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
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
                <Text>总体统计</Text>
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
                  <View className={classnames(styles.overviewItem, styles.suggest)}>
                    <Text className={styles.overviewValue}>{stats.followup}</Text>
                    <Text className={styles.overviewLabel}>需复诊</Text>
                  </View>
                  <View className={classnames(styles.overviewItem, styles.delay)}>
                    <Text className={styles.overviewValue}>{stats.unchecked}</Text>
                    <Text className={styles.overviewLabel}>未检查</Text>
                  </View>
                </View>
                {reportVersion === 'internal' && (
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
                )}
              </View>
            </View>

            <View className={styles.section}>
              <View className={styles.sectionTitle}>
                <Text className={styles.sectionTitleIcon}>🏫</Text>
                <Text>各校完成情况</Text>
              </View>
              {schoolSummaries.map(school => (
                <View key={school.schoolName} className={styles.schoolSection}>
                  <View className={styles.schoolHeader}>
                    <Text className={styles.schoolName}>{school.schoolName}</Text>
                    <Text className={styles.schoolStats}>
                      已完成{school.completed}/{school.total}人
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
                          <View className={styles.progressFill} style={{ width: `${cls.percent}%` }} />
                        </View>
                        <View className={styles.classDetail}>
                          <View className={styles.detailItem}>
                            <View className={classnames(styles.detailDot, styles.suggest)} />
                            <Text>需复诊{cls.followup}</Text>
                          </View>
                          <View className={styles.detailItem}>
                            <View className={classnames(styles.detailDot, styles.done)} />
                            <Text>已封{cls.doneCount}</Text>
                          </View>
                          <View className={styles.detailItem}>
                            <View className={classnames(styles.detailDot, styles.delay)} />
                            <Text>未检查{cls.unchecked}</Text>
                          </View>
                        </View>

                        {cls.unchecked > 0 && (
                          <View className={styles.classStudentList}>
                            <Text className={styles.classStudentListTitle}>未检查（{cls.unchecked}人）：</Text>
                            {cls.students.filter(s => getStudentStatus(s) === 'unchecked').map(s => (
                              <View key={s.id} className={styles.classStudentItem} onClick={() => handleStudentClick(s.id)}>
                                <Text>{s.name}</Text>
                                <Text className={styles.classStudentPhone}>{s.guardianPhone}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {cls.followup > 0 && (
                          <View className={styles.classStudentList}>
                            <Text className={styles.classStudentListTitle}>需复诊（{cls.followup}人）：</Text>
                            {cls.students.filter(s => getStudentStatus(s) === 'followup').map(s => {
                              const fu = getFollowUpByStudent(s.id)
                              const suggestTeeth = s.toothRecords.filter(r => r.status === 'suggest').map(r => r.toothName)
                              return (
                                <View key={s.id} className={styles.classStudentItem} onClick={() => handleStudentClick(s.id)}>
                                  <View style={{ display: 'flex', flexDirection: 'column', gap: '4rpx' }}>
                                    <Text>{s.name}</Text>
                                    {suggestTeeth.length > 0 && (
                                      <Text className={styles.classStudentTeeth}>
                                        建议：{suggestTeeth.join('、')}
                                      </Text>
                                    )}
                                  </View>
                                  {fu && (
                                    <View className={classnames(styles.followUpBadge, styles[fu.status])}>
                                      <Text>{FOLLOWUP_LABEL[fu.status]}</Text>
                                    </View>
                                  )}
                                </View>
                              )
                            })}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {reportVersion === 'internal' && allDoctors.length > 0 && (
              <View className={styles.section}>
                <View className={styles.sectionTitle}>
                  <Text className={styles.sectionTitleIcon}>👨‍⚕️</Text>
                  <Text>医生工作量</Text>
                </View>
                <View className={styles.overviewCard}>
                  {allDoctors.map(doctor => {
                    if (doctorFilter && doctor !== doctorFilter) return null
                    const doctorStudents = filteredStudents.filter(s =>
                      s.toothRecords.some(r => r.doctorSignature === doctor)
                    )
                    const doctorDoneCount = filteredStudents.reduce((sum, s) =>
                      sum + s.toothRecords.filter(r => r.doctorSignature === doctor && r.status === 'done').length, 0
                    )
                    return (
                      <View key={doctor} className={styles.doctorRow}>
                        <Text className={styles.doctorName}>{doctor}</Text>
                        <View className={styles.doctorStats}>
                          <Text className={styles.doctorStat}>
                            检查 {doctorStudents.length} 人
                          </Text>
                          <Text className={styles.doctorStat}>
                            已封闭 {doctorDoneCount} 颗
                          </Text>
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            )}
          </>
        ) : (
          <View className={styles.section}>
            <View className={styles.reportContent}>
              {reportContent.split('\n').map((line, index) => (
                <Text key={index} className={styles.reportLine}>{line || '\n'}</Text>
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
