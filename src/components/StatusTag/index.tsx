import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import { TreatmentStatus, STATUS_LABEL } from '@/types'
import styles from './index.module.scss'

interface StatusTagProps {
  status: TreatmentStatus
  size?: 'small' | 'normal'
}

const StatusTag: React.FC<StatusTagProps> = ({ status, size = 'normal' }) => {
  const getTagClass = () => {
    switch (status) {
      case 'suggest':
        return styles.suggest
      case 'done':
        return styles.done
      case 'delay':
        return styles.delay
      default:
        return ''
    }
  }

  return (
    <View className={classnames(styles.tag, getTagClass(), size === 'small' && styles.small)}>
      <Text>{STATUS_LABEL[status]}</Text>
    </View>
  )
}

export default StatusTag
