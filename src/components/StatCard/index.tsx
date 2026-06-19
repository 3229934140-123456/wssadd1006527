import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

interface StatCardProps {
  title: string
  value: number
  subtitle?: string
  type?: 'primary' | 'success' | 'warning' | 'default'
  onClick?: () => void
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, type = 'default', onClick }) => {
  return (
    <View
      className={classnames(styles.card, styles[type])}
      onClick={onClick}
    >
      <View className={styles.content}>
        <Text className={styles.title}>{title}</Text>
        <Text className={styles.value}>{value}</Text>
        {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  )
}

export default StatCard
