import { Button, Result } from 'antd'
import type { PropsWithChildren } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppFrame } from './AppFrame'
import { useMovementStore } from '../store'
import type { Role } from '../types'

type ProtectedRouteProps = Readonly<PropsWithChildren<{ allow?: Role[] }>>

export function ProtectedRoute({ children, allow }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const session = useMovementStore((state) => state.session)

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (allow && !allow.includes(session.role)) {
    return (
      <AppFrame>
        <Result
          status="403"
          title="Không có quyền truy cập"
          subTitle="Màn hình này chỉ hiển thị cho đúng nhóm quyền được mô tả trong yêu cầu."
          extra={<Button onClick={() => navigate('/stations')}>Quay về danh sách trạm</Button>}
        />
      </AppFrame>
    )
  }

  return <AppFrame>{children}</AppFrame>
}