import React, { useState } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import classnames from 'classnames'
import Taro from '@tarojs/taro'
import {
  ToothRecord,
  TreatmentStatus,
  ToothType,
  PERMANENT_TEETH,
  PRIMARY_TEETH,
  STATUS_LABEL,
  COOPERATION_LABEL,
  CooperationLevel,
} from '@/types'
import styles from './index.module.scss'

interface ToothChartProps {
  records: ToothRecord[]
  onToothClick: (toothId: string, status: TreatmentStatus, extra?: Partial<ToothRecord>) => void
  disabled?: boolean
}

const ToothChart: React.FC<ToothChartProps> = ({ records, onToothClick, disabled }) => {
  const [toothType, setToothType] = useState<ToothType>('permanent')
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<TreatmentStatus>('suggest')
  const [materialBatch, setMaterialBatch] = useState('')
  const [doctorSignature, setDoctorSignature] = useState('')
  const [cooperation, setCooperation] = useState<CooperationLevel>('good')
  const [showDetail, setShowDetail] = useState(false)

  const teethList = toothType === 'permanent' ? PERMANENT_TEETH : PRIMARY_TEETH

  const getToothRecord = (toothId: string): ToothRecord | undefined => {
    return records.find(r => r.toothId === toothId)
  }

  const getToothStatusClass = (toothId: string) => {
    const record = getToothRecord(toothId)
    if (!record) return ''
    switch (record.status) {
      case 'suggest':
        return styles.statusSuggest
      case 'done':
        return styles.statusDone
      case 'delay':
        return styles.statusDelay
      default:
        return ''
    }
  }

  const handleToothClick = (toothId: string) => {
    if (disabled) return
    const existingRecord = getToothRecord(toothId)

    if (!existingRecord) {
      setSelectedTooth(toothId)
      setCurrentStatus('suggest')
      setMaterialBatch('')
      setDoctorSignature('')
      setCooperation('good')
      setShowDetail(true)
    } else {
      setSelectedTooth(toothId)
      setCurrentStatus(existingRecord.status)
      setMaterialBatch(existingRecord.materialBatch || '')
      setDoctorSignature(existingRecord.doctorSignature || '')
      setCooperation(existingRecord.cooperation || 'good')
      setShowDetail(true)
    }
  }

  const handleQuickStatus = (toothId: string, status: TreatmentStatus) => {
    if (disabled) return
    const existing = getToothRecord(toothId)
    const extra: Partial<ToothRecord> = {}

    if (status === 'done') {
      if (existing?.materialBatch) extra.materialBatch = existing.materialBatch
      if (existing?.doctorSignature) extra.doctorSignature = existing.doctorSignature
      if (existing?.cooperation) extra.cooperation = existing.cooperation
    }

    onToothClick(toothId, status, extra)
    Taro.showToast({ title: STATUS_LABEL[status], icon: 'success', duration: 800 })
  }

  const handleConfirm = () => {
    if (!selectedTooth) return

    const extra: Partial<ToothRecord> = {}
    if (currentStatus === 'done') {
      if (materialBatch) extra.materialBatch = materialBatch
      if (doctorSignature) extra.doctorSignature = doctorSignature
      extra.cooperation = cooperation
    }

    onToothClick(selectedTooth, currentStatus, extra)
    setShowDetail(false)
    setSelectedTooth(null)
    Taro.showToast({ title: '记录已保存', icon: 'success' })
  }

  const handleClear = () => {
    if (!selectedTooth) return
    onToothClick(selectedTooth, 'suggest', {})
    setShowDetail(false)
    setSelectedTooth(null)
  }

  const renderToothGrid = (teeth: typeof PERMANENT_TEETH, start: number, end: number, label: string) => {
    const subset = teeth.slice(start, end)
    return (
      <View className={styles.quadrant}>
        <Text className={styles.quadrantLabel}>{label}</Text>
        <View className={styles.toothRow}>
          {subset.map(tooth => {
            const record = getToothRecord(tooth.id)
            return (
              <View key={tooth.id} className={styles.toothWrapper}>
                <View
                  className={classnames(
                    styles.toothBtn,
                    getToothStatusClass(tooth.id),
                    selectedTooth === tooth.id && styles.selected,
                    disabled && styles.disabled
                  )}
                  onClick={() => handleToothClick(tooth.id)}
                  onLongPress={() => handleQuickStatus(tooth.id, 'done')}
                >
                  <Text className={styles.toothNumber}>{tooth.name}</Text>
                </View>
                {record && (
                  <View className={styles.quickActions}>
                    <View
                      className={classnames(styles.quickBtn, styles.quickSuggest)}
                      onClick={(e) => { e.stopPropagation(); handleQuickStatus(tooth.id, 'suggest') }}
                    >
                      <Text className={styles.quickText}>建</Text>
                    </View>
                    <View
                      className={classnames(styles.quickBtn, styles.quickDone)}
                      onClick={(e) => { e.stopPropagation(); handleQuickStatus(tooth.id, 'done') }}
                    >
                      <Text className={styles.quickText}>封</Text>
                    </View>
                    <View
                      className={classnames(styles.quickBtn, styles.quickDelay)}
                      onClick={(e) => { e.stopPropagation(); handleQuickStatus(tooth.id, 'delay') }}
                    >
                      <Text className={styles.quickText}>缓</Text>
                    </View>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  return (
    <View className={styles.container}>
      <View className={styles.typeSwitch}>
        <View
          className={classnames(styles.switchBtn, toothType === 'permanent' && styles.active)}
          onClick={() => setToothType('permanent')}
        >
          <Text className={styles.switchText}>恒牙</Text>
        </View>
        <View
          className={classnames(styles.switchBtn, toothType === 'primary' && styles.active)}
          onClick={() => setToothType('primary')}
        >
          <Text className={styles.switchText}>乳牙</Text>
        </View>
      </View>

      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={classnames(styles.legendDot, styles.statusSuggest)} />
          <Text className={styles.legendText}>建议封闭</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classnames(styles.legendDot, styles.statusDone)} />
          <Text className={styles.legendText}>已封闭</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classnames(styles.legendDot, styles.statusDelay)} />
          <Text className={styles.legendText}>暂缓处理</Text>
        </View>
      </View>

      <View className={styles.chart}>
        <View className={styles.upperJaw}>
          {renderToothGrid(teethList, 0, 8, '右上')}
          {renderToothGrid(teethList, 8, 16, '左上')}
        </View>
        <View className={styles.midLine}>
          <Text className={styles.midLineText}>— 中线 —</Text>
        </View>
        <View className={styles.lowerJaw}>
          {renderToothGrid(teethList, 24, 32, '右下')}
          {renderToothGrid(teethList, 16, 24, '左下')}
        </View>
      </View>

      {showDetail && selectedTooth && (
        <View className={styles.modalOverlay} onClick={() => setShowDetail(false)}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>
                {teethList.find(t => t.id === selectedTooth)?.name || selectedTooth} 牙位记录
              </Text>
              <Text className={styles.modalSubtitle}>
                {teethList.find(t => t.id === selectedTooth)?.position}
              </Text>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.label}>处理状态</Text>
              <View className={styles.statusBtns}>
                {(['suggest', 'done', 'delay'] as TreatmentStatus[]).map(status => (
                  <View
                    key={status}
                    className={classnames(
                      styles.statusOption,
                      currentStatus === status && styles[`statusOption${status.charAt(0).toUpperCase() + status.slice(1)}`],
                      currentStatus === status && styles.statusOptionActive
                    )}
                    onClick={() => setCurrentStatus(status)}
                  >
                    <Text className={styles.statusOptionText}>{STATUS_LABEL[status]}</Text>
                  </View>
                ))}
              </View>
            </View>

            {currentStatus === 'done' && (
              <>
                <View className={styles.formGroup}>
                  <Text className={styles.label}>材料批号</Text>
                  <Input
                    className={styles.input}
                    placeholder="请输入材料批号"
                    value={materialBatch}
                    onInput={(e) => setMaterialBatch(e.detail.value)}
                  />
                </View>
                <View className={styles.formGroup}>
                  <Text className={styles.label}>医生签名</Text>
                  <Input
                    className={styles.input}
                    placeholder="请输入医生姓名"
                    value={doctorSignature}
                    onInput={(e) => setDoctorSignature(e.detail.value)}
                  />
                </View>
                <View className={styles.formGroup}>
                  <Text className={styles.label}>儿童配合度</Text>
                  <View className={styles.statusBtns}>
                    {(['good', 'normal', 'poor'] as CooperationLevel[]).map(level => (
                      <View
                        key={level}
                        className={classnames(
                          styles.statusOption,
                          cooperation === level && styles.cooperationActive
                        )}
                        onClick={() => setCooperation(level)}
                      >
                        <Text className={styles.statusOptionText}>{COOPERATION_LABEL[level]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}

            <View className={styles.modalActions}>
              <Button
                className={classnames(styles.modalBtn, styles.btnCancel)}
                onClick={handleClear}
              >
                <Text>清除记录</Text>
              </Button>
              <Button
                className={classnames(styles.modalBtn, styles.btnConfirm)}
                onClick={handleConfirm}
              >
                <Text>确认保存</Text>
              </Button>
            </View>
          </View>
        </View>
      )}

      <View className={styles.tip}>
        <Text className={styles.tipText}>💡 点击牙位记录详情，长按快速标记"已封闭"</Text>
      </View>
    </View>
  )
}

export default ToothChart
