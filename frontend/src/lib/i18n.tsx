import { createContext, useContext } from 'react'

export type Locale = 'en' | 'zh-CN'

const zh: Record<string, string> = {
  'This Week': '本周', 'All Time': '全部记录', 'Previous week': '上一周', 'Next week': '下一周',
  Adjust: '调整', Delete: '删除', Cancel: '取消', TODAY: '今天', rest: '休息',
  Status: '状态', Done: '完成', Skipped: '跳过', Pending: '待完成', Injured: '受伤', Cancelled: '取消',
  'How did it feel?': '感觉如何？', Great: '非常好', Good: '良好', Okay: '一般', Tough: '吃力',
  Notes: '备注', "Today's plan": '今日计划', 'Add a note…': '添加备注…', 'Add time': '添加时间',
  'Mark as pending': '标记为待完成', 'Mark as done': '标记为完成', Close: '关闭',
  'By type': '按类型', 'Week not tracked': '本周未记录', 'Office days': '到办公室的日期',
  Football: '足球', Strength: '力量', Speed: '速度', Cardio: '有氧', Chinese: '中文学习',
  Monday: '星期一', Tuesday: '星期二', Wednesday: '星期三', Thursday: '星期四',
  Friday: '星期五', Saturday: '星期六', Sunday: '星期日',
  Mon: '一', Tue: '二', Wed: '三', Thu: '四', Fri: '五', Sat: '六', Sun: '日',
  Settings: '设置', 'View profile and settings': '查看个人资料和设置', 'Profile and settings': '个人资料和设置',
  Language: '语言', English: '英语', 'Simplified Chinese': '简体中文',
  'Add person': '添加用户', 'Sign out': '退出登录', Username: '用户名', Password: '密码',
  'Widget token': '小组件令牌', 'Generate widget token': '生成小组件令牌',
  Name: '姓名', 'Sign in': '登录', 'Create owner account': '创建主账户', 'Create account': '创建账户',
  'Welcome to Habitual': '欢迎使用 Habitual', 'Set up the owner account to keep existing data.': '创建主账户以保留现有数据。',
  'Could not connect to server.': '无法连接服务器。', 'Check your connection and reload.': '请检查网络后重新加载。',
  'Completion rate': '完成率', 'Sessions done': '已完成次数', 'Weeks tracked': '记录周数', 'Avg per week': '每周平均',
  'Past Weeks': '过往周次', 'No history yet': '暂无历史记录', 'How It Felt': '训练感受',
  'By Type': '按类型', 'Sessions rated': '次已评分',
  'Build your profile': '建立你的个人资料', 'Your goals and preferences guide every weekly plan.': '你的目标和偏好将指导每周计划。',
  Goals: '目标', 'Add at least one goal and put the most important first.': '至少添加一个目标，并将最重要的放在前面。',
  'Goal description': '目标描述', 'High priority': '高优先级', 'Medium priority': '中优先级', 'Low priority': '低优先级',
  'Weekly target': '每周目标', 'Add goal': '添加目标', 'Preferred activities': '偏好活动',
  'Add anything you want the planner to schedule.': '添加你希望计划安排的任何活动。', 'Activity name': '活动名称',
  Sport: '运动', Mobility: '灵活性', Recovery: '恢复', Learning: '学习', Lifestyle: '生活方式', Other: '其他',
  'Activity notes': '活动备注', 'Add activity': '添加活动', 'Recurring commitments': '固定活动',
  'Fixed activities are anchors in the weekly plan.': '固定活动是每周计划的锚点。', 'Choose activity': '选择活动',
  'Add commitment': '添加固定活动', 'Normal availability': '常规可用时间', 'Add the times the planner can normally use.': '添加计划通常可以使用的时间。',
  'Add availability': '添加可用时间', 'Planning details': '计划详情', 'One item per line. These fields are optional.': '每行一项，这些字段为可选项。',
  'Equipment available': '可用设备', 'Persistent limitations': '长期限制', 'Activities to avoid': '避免的活动',
  'Anything else the planner should know': '计划还需要了解的其他信息', 'Save profile': '保存个人资料',
  'Saving…': '保存中…', 'Loading profile…': '正在加载个人资料…', 'Could not save profile': '无法保存个人资料',
  'Could not load profile': '无法加载个人资料',
  'Edit profile': '编辑个人资料', 'Times per week': '每周次数', Minutes: '分钟',
  'No goals added': '尚未添加目标', 'No activities added': '尚未添加活动', 'Availability windows': '可用时间段',
  'Session brief': '活动简介',
  'Optional deadline': '可选截止日期', 'Treat as fixed': '设为固定活动',
  'Add at least one goal': '请至少添加一个目标', 'Add at least one preferred activity': '请至少添加一个偏好活动',
  'Add at least one availability window or recurring commitment': '请至少添加一个可用时间段或固定活动',
  'Preferred activity names must be unique': '偏好活动名称不能重复',
  'Injury body part': '受伤部位', 'Ankle / Foot': '脚踝 / 足部', Knee: '膝盖', 'Shoulder / Arm': '肩膀 / 手臂',
  'Wrist / Hand': '手腕 / 手部', 'Back / Spine': '背部 / 脊柱', 'Hip / Groin': '髋部 / 腹股沟', Illness: '生病',
  Mild: '轻微', Moderate: '中等', Severe: '严重', 'Notes (optional)': '备注（可选）',
  'Proposed schedule': '建议计划', 'Proposed changes': '建议调整', was: '原为', add: '添加', Back: '返回',
  'Applying…': '正在应用…', 'Start week': '开始本周', 'Apply changes': '应用调整',
  'affected, tap to remove': '已受影响，点击移除', 'tap to mark as affected': '点击标记为受影响', 'no time set': '未设置时间',
  injured: '受伤', cancelled: '取消', skipped: '跳过', done: '完成', 'Reason (optional)': '原因（可选）',
  'Plan this week': '规划本周', 'Adjust this week': '调整本周', 'Week planned': '本周计划已完成', 'Schedule updated': '计划已更新',
  'Planning your week…': '正在规划本周…', 'Planning adjustments…': '正在规划调整…',
  'Office days this week': '本周到办公室的日期', 'Office days are passed to the planner as a weekly scheduling constraint.': '到办公室的日期将作为本周的排期限制。',
  off: '暂停', on: '进行', 'Any injuries?': '有受伤情况吗？', Yes: '是', No: '否', 'Anything else?': '还有其他情况吗？',
  'For example, busy Tuesday evening or travelling Friday': '例如周二晚上很忙，或周五外出',
  'Sessions this week': '本周活动', 'No sessions this week.': '本周没有活动。', 'Additional context': '其他情况',
  'Anything else affecting this week': '其他会影响本周安排的情况', 'Propose changes': '建议调整',
  'No schedule was returned. Please try again.': '未生成计划，请重试。', 'Something went wrong. Please try again.': '出现问题，请重试。',
  'Failed to apply. Please try again.': '应用失败，请重试。',
  Priority: '优先级', Category: '类别', Activity: '活动', Day: '星期', 'Start time': '开始时间',
  'End time': '结束时间', 'Duration minutes': '时长（分钟）', Remove: '删除', Severity: '严重程度',
  'Injury notes': '受伤备注', 'New user language': '新用户语言', 'Session time': '活动时间',
  'Adjust week with AI': '使用 AI 调整本周', 'Delete this week': '删除本周',
}

export function translate(locale: Locale, value: string) {
  if (locale !== 'zh-CN') return value
  return zh[value] ?? value
}

const I18nContext = createContext<{ locale: Locale; t: (value: string) => string }>({
  locale: 'en', t: value => value,
})

export const I18nProvider = I18nContext.Provider
export const useI18n = () => useContext(I18nContext)
