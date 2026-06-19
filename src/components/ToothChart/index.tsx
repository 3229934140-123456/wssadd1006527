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
  onBatchUpdate?: (toothIds: string[], status: TreatmentStatus, extra?: Partial<ToothRecord>) => void
  disabled?: boolean
}

const ToothChart: React.FC<ToothChartProps> = ({ records, onToothClick, onBatchUpdate, disabled }) => {
  const [toothType, setToothType] = useState<ToothType>('permanent')
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<TreatmentStatus>('suggest')
  const [materialBatch, setMaterialBatch] = useState('')
  const [doctorSignature, setDoctorSignature] = useState('')
  const [cooperation, setCooperation] = useState<CooperationLevel>('good')
  const [showDetail, setShowDetail] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [batchSelectedTeeth, setBatchSelectedTeeth] = useState<Set<string>>(new Set())
  const [batchStatus, setBatchStatus] = useState<TreatmentStatus>('suggest')
  const [batchMaterial, setBatchMaterial] = useState('')
  const [batchDoctor, setBatchDoctor] = useState('')
  const [batchCooperation, setBatchCooperation] = useState<CooperationLevel>('good')
  const [showBatchModal, setShowBatchModal] = useState(false)

  const teethList = toothType === 'permanent' ? PERMANENT_TEETH : PRIMARY_TEETH

  const getToothRecord = (toothId: string): ToothRecord | undefined => {
    return records.find(r => r.toothId === toothId)
  }

  const getToothStatusClass = (toothId: string) => {
    const record = getToothRecord(toothId)
    if (!record) return ''
    switch (record.status) {
      case 'suggest': return styles.statusSuggest
      case 'done': return styles.statusDone
      case 'delay': return styles.statusDelay
      default: return ''
    }
  }

  const handleToothClick = (toothId: string) => {
    if (disabled) return
    if (batchMode) {
      setBatchSelectedTeeth(prev => {
        const next = new Set(prev)
        if (next.has(toothId)) {
          next.delete(toothId)
        } else {
          next.add(toothId)
        }
        return next
      })
      return
    }
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

  const handleBatchConfirm = () => {
    if (batchSelectedTeeth.size === 0) {
      Taro.showToast({ title: '请先选择牙位', icon: 'none' })
      return
    }
    const extra: Partial<ToothRecord> = {}
    if (batchStatus === 'done') {
      if (batchMaterial) extra.materialBatch = batchMaterial
      if (batchDoctor) extra.doctorSignature = batchDoctor
      extra.cooperation = batchCooperation
    }
    const toothIds = Array.from(batchSelectedTeeth)
    if (onBatchUpdate) {
      onBatchUpdate(toothIds, batchStatus, extra)
    } else {
      toothIds.forEach(toothId => {
        onToothClick(toothId, batchStatus, extra)
      })
    }
    setShowBatchModal(false)
    setBatchSelectedTeeth(new Set())
    setBatchMode(false)
    Taro.showToast({ title: `已保存${toothIds.length}颗牙记录`, icon: 'success' })
  }

  const toggleBatchMode = () => {
    if (batchMode) {
      setBatchMode(false)
      setBatchSelectedTeeth(new Set())
    } else {
      setBatchMode(true)
      setShowDetail(false)
      setSelectedTooth(null)
    }
  }

  const openBatchModal = () => {
    if (batchSelectedTeeth.size === 0) {
      Taro.showToast({ title: '请先点击选择牙位', icon: 'none' })
      return
    }
    setBatchStatus('suggest')
    setBatchMaterial('')
    setBatchDoctor('')
    setBatchCooperation('good')
    setShowBatchModal(true)
  }

  const renderToothGrid = (teeth: typeof PERMANENT_TEETH, label: string, indices: number[]) => {
    const subset = indices.map(i => teeth[i]).filter(Boolean)
    return (
      <View className={styles.quadrant}>
        <Text className={styles.quadrantLabel}>{label}</Text>
        <View className={styles.toothRow}>
          {subset.map(tooth => {
            const record = getToothRecord(tooth.id)
            const isBatchSelected = batchSelectedTeeth.has(tooth.id)
            return (
              <View key={tooth.id} className={styles.toothWrapper}>
                <View
                  className={classnames(
                    styles.toothBtn,
                    getToothStatusClass(tooth.id),
                    !batchMode && selectedTooth === tooth.id && styles.selected,
                    batchMode && isBatchSelected && styles.batchSelected,
                    disabled && styles.disabled
                  )}
                  onClick={() => handleToothClick(tooth.id)}
                  onLongPress={() => { if (!batchMode) handleQuickStatus(tooth.id, 'done') }}
                >
                  <Text className={styles.toothNumber}>{tooth.name}</Text>
                  {batchMode && isBatchSelected && (
                    <Text className={styles.batchCheck}>✓</Text>
                  )}
                </View>
                {!batchMode && record && (
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

  const getQuadrantIndices = () => {
    if (toothType === 'permanent') {
      return {
        upperRight: [0, 1, 2, 3, 4, 5, 6, 7],
        upperLeft: [8, 9, 10, 11, 12, 13, 14, 15],
        lowerRight: [16, 17, 18, 19, 20, 21, 22, 23],
        lowerLeft: [24, 25, 26, 27, 28, 29, 30, 31],
      }
    } else {
      return {
        upperRight: [0, 1, 2, 3, 4],
        upperLeft: [5, 6, 7, 8, 9],
        lowerRight: [10, 11, 12, 13, 14],
        lowerLeft: [15, 16, 17, 18, 19],
      }
    }
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
        <View
          className={classnames(styles.switchBtn, batchMode && styles.batchActive)}
          onClick={toggleBatchMode}
        >
          <Text className={styles.switchText}>{batchMode ? '退出批量' : '批量'}</Text>
        </View>
      </View>

      {batchMode && (
        <View className={styles.batchBar}>
          <Text className={styles.batchInfo}>
            已选 {batchSelectedTeeth.size} 颗牙
          </Text>
          <Button className={styles.batchConfirmBtn} onClick={openBatchModal}>
            批量登记
          </Button>
        </View>
      )}

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
        {(() => {
          const q = getQuadrantIndices()
          return (
            <>
              <View className={styles.upperJaw}>
                {renderToothGrid(teethList, '右上', q.upperRight)}
                {renderToothGrid(teethList, '左上', q.upperLeft)}
              </View>
              <View className={styles.midLine}>
                <Text className={styles.midLineText}>— 中线 —</Text>
              </View>
              <View className={styles.lowerJaw}>
                {renderToothGrid(teethList, '右下', q.lowerRight)}
                {renderToothGrid(teethList, '左下', q.lowerLeft)}
              </View>
            </>
          )
        })()}
      </View>

      {!batchMode && showDetail && selectedTooth && (
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
                        className={classnames(styles.statusOption, cooperation === level && styles.cooperationActive)}
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
              <Button className={classnames(styles.modalBtn, styles.btnCancel)} onClick={handleClear}>
                <Text>清除记录</Text>
              </Button>
              <Button className={classnames(styles.modalBtn, styles.btnConfirm)} onClick={handleConfirm}>
                <Text>确认保存</Text>
              </Button>
            </View>
          </View>
        </View>
      )}

      {batchMode && showBatchModal && (
        <View className={styles.modalOverlay} onClick={() => setShowBatchModal(false)}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>批量登记 ({batchSelectedTeeth.size}颗牙)</Text>
              <Text className={styles.modalSubtitle}>
                将对所选牙位统一设置状态
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
                      batchStatus === status && styles[`statusOption${status.charAt(0).toUpperCase() + status.slice(1)}`],
                      batchStatus === status && styles.statusOptionActive
                    )}
                    onClick={() => setBatchStatus(status)}
                  >
                    <Text className={styles.statusOptionText}>{STATUS_LABEL[status]}</Text>
                  </View>
                ))}
              </View>
            </View>
            {batchStatus === 'done' && (
              <>
                <View className={styles.formGroup}>
                  <Text className={styles.label}>材料批号</Text>
                  <Input
                    className={styles.input}
                    placeholder="统一填写材料批号"
                    value={batchMaterial}
                    onInput={(e) => setBatchMaterial(e.detail.value)}
                  />
                </View>
                <View className={styles.formGroup}>
                  <Text className={styles.label}>医生签名</Text>
                  <Input
                    className={styles.input}
                    placeholder="统一填写医生姓名"
                    value={batchDoctor}
                    onInput={(e) => setBatchDoctor(e.detail.value)}
                  />
                </View>
                <View className={styles.formGroup}>
                  <Text className={styles.label}>儿童配合度</Text>
                  <View className={styles.statusBtns}>
                    {(['good', 'normal', 'poor'] as CooperationLevel[]).map(level => (
                      <View
                        key={level}
                        className={classnames(styles.statusOption, batchCooperation === level && styles.cooperationActive)}
                        onClick={() => setBatchCooperation(level)}
                      >
                        <Text className={styles.statusOptionText}>{COOPERATION_LABEL[level]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
            <View className={styles.modalActions}>
              <Button className={classnames(styles.modalBtn, styles.btnCancel)} onClick={() => setShowBatchModal(false)}>
                <Text>取消</Text>
              </Button>
              <Button className={classnames(styles.modalBtn, styles.btnConfirm)} onClick={handleBatchConfirm}>
                <Text>保存全部</Text>
              </Button>
            </View>
          </View>
        </View>
      )}

      <View className={styles.tip}>
        <Text className={styles.tipText}>
          {batchMode
            ? '💡 点击选择多个牙位，然后点"批量登记"统一设置'
            : '💡 点击牙位记录详情，长按快速标记"已封闭"，切换"批量"可多选'}
        </Text>
      </View>
    </View>
  )
}

export default ToothChart
