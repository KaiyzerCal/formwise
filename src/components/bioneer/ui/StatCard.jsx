import React from "react";
import { COLORS, FONT } from "./DesignTokens";
import { Card, CardBody } from "@/components/ui";

export default function StatCard({ label, value, icon: Icon, color, children, className = '' }) {
  return (
    <Card className={className}>
      <CardBody className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] tracking-[0.15em] uppercase" style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}>
            {label}
          </span>
          {Icon && <Icon size={15} strokeWidth={1.5} style={{ color: color || COLORS.gold }} />}
        </div>
        {children || (
          <div className="text-2xl font-bold" style={{ color: color || COLORS.textPrimary, fontFamily: FONT.heading }}>
            {value}
          </div>
        )}
      </CardBody>
    </Card>
  );
}