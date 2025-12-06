import { FC, FocusEvent } from 'react'

interface TextareaProps {
  placeholder?: string
  onBlur?: (evt: FocusEvent<HTMLTextAreaElement>) => void
  autoFocus?: boolean
}

export const Textarea: FC<TextareaProps> = ({
  placeholder,
  onBlur,
  autoFocus,
}) => {
  return (
    <textarea
      className="bg-gray-50 dark:bg-gray-700  p-4 shadow-sm rounded-lg focus:outline-hidden"
      placeholder={placeholder}
      onBlur={onBlur}
      autoFocus={autoFocus}
    />
  )
}
