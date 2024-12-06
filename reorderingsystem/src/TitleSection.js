import React from 'react';
import { Card, CardContent } from './components/ui/card.tsx';
import { Box } from 'lucide-react';

const TitleSection = () => {
    return (
      <div className="flex flex-col items-center justify-center mt-8 mb-12">
        <Box className="h-8 w-8 text-gray-900 mb-2" />
        <h1 className="text-xl font-medium text-gray-900 mb-1">
          StockFlow
        </h1>
        <p className="text-sm text-gray-700">
          Intelligent Inventory Management
        </p>
      </div>
    );
  };

export default TitleSection;