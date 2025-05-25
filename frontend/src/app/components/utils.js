import { ExclamationTriangleIcon, CheckCircleIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Loading Spinner Component
export function LoadingSpinner({ size = 'medium', className = '' }) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <ArrowPathIcon 
      className={`${sizeClasses[size]} animate-spin text-sky-600 ${className}`}
    />
  );
}

// Loading State Component
export function LoadingState({ message = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <LoadingSpinner size="large" />
      <p className="mt-4 text-gray-600 text-lg">{message}</p>
    </div>
  );
}

// Error Alert Component
export function ErrorAlert({ message, onDismiss, className = '' }) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-800">{message}</p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onDismiss}
                className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Success Alert Component
export function SuccessAlert({ message, onDismiss, className = '' }) {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-5 w-5 text-green-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-green-800">{message}</p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onDismiss}
                className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Empty State Component
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = '' 
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
}

// Badge Component for Status/Urgency
export function Badge({ 
  children, 
  variant = 'default', 
  size = 'medium',
  className = '' 
}) {
  const baseClasses = 'inline-flex items-center rounded-full border font-medium';
  
  const variantClasses = {
    default: 'bg-gray-50 text-gray-800 border-gray-200',
    high: 'bg-red-50 text-red-600 border-red-200',
    medium: 'bg-orange-50 text-orange-600 border-orange-200',
    low: 'bg-green-50 text-green-600 border-green-200',
    pending: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    in_progress: 'bg-blue-50 text-blue-600 border-blue-200',
    fulfilled: 'bg-green-50 text-green-600 border-green-200',
    success: 'bg-green-50 text-green-600 border-green-200',
    warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    error: 'bg-red-50 text-red-600 border-red-200'
  };

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2.5 py-0.5 text-xs',
    large: 'px-3 py-1 text-sm'
  };

  return (
    <span 
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Confirmation Modal Component
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary'
}) {
  if (!isOpen) return null;

  const confirmClasses = {
    primary: 'bg-sky-600 hover:bg-sky-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
          <p className="text-gray-600 mb-6">{description}</p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium ${confirmClasses[confirmVariant]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility functions for formatting
export const formatDistance = (distance) => {
  if (!distance) return 'Unknown distance';
  return `${distance} km away`;
};

export const formatTimeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInHours = (now - past) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Less than an hour ago';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
};

export const formatRequestType = (type) => {
  const typeLabels = {
    food: 'Food',
    water: 'Water',
    shelter: 'Shelter',
    transport: 'Transportation',
    medical: 'Medical',
    other: 'Other'
  };
  return typeLabels[type] || type;
};

export const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case 'high': return 'high';
    case 'medium': return 'medium';
    case 'low': return 'low';
    default: return 'default';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'pending';
    case 'in_progress': return 'in_progress';
    case 'fulfilled': return 'fulfilled';
    default: return 'default';
  }
};