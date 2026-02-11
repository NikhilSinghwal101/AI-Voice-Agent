import React from 'react'
import ReactMarkdown from 'react-markdown'
import './SummaryBox.css'

function SummaryBox({ summary }) {
  return (
    <div className='summaryContainer border border-gray-100 rounded-xl'>
      <ReactMarkdown className='text-sm/7'>{summary}</ReactMarkdown>
    </div>
  )
}

export default SummaryBox
