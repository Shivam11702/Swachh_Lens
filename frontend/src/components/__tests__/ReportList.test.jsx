import React from 'react'
import { render, screen } from '@testing-library/react'
import { test, expect } from 'vitest'
import '@testing-library/jest-dom'
import ReportList from '../ReportList'

test('renders no reports message', ()=>{
  render(<ReportList reports={[]} onSelect={()=>{}} page={1} limit={20} total={0} onPageChange={()=>{}} />)
  expect(screen.getByText(/No reports/i)).toBeInTheDocument()
})