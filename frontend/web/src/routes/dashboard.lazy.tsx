import { createLazyFileRoute } from '@tanstack/react-router'
import { Dashboard } from '../ts/pages/Dashboard'
import React from 'react'

export const Route = createLazyFileRoute('/dashboard')({
  component: () => <Dashboard />,
})