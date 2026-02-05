import React, { useState } from "react";
import { currency, HeaderType, prioriry } from "../../utils/types";
import { cn } from "../../lib/utils";
import LongDesc from "../LongDesc";
// import ThreeDotIcon from "../svgs/ThreedotIcon";
import ActionDropdown from "../ActionDropdown";
import Badge from "../Badge";
import TooltipForTags from "../TooltipForTags";
import Toggle from "../Toggle";
import { MEDIA_URL } from "../../utils/config";
import { getCleanImageUrl } from "../../utils/common";

const TableRow = ({ data, columns, isCompressView, handleChecked }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  return (
    <>
      <div
        key={data?._id}
        className={cn(
          isCompressView ? "p-0" : "p-2",
          "grid grid-cols-12 items-center text-xs lg:text-sm hover:bg-accent/5 transition"
        )}
      >
        {columns.map((col) => {
          const { value, _class = "col-span-1", type, actions } = col;
          const commonProps = {
            className: cn(
              _class,
              "w-full px-2 py-2 text-nowrap overflow-x-auto whitespace-nowrap scrollbar-hide"
            ),
          };

          switch (type) {
            case HeaderType.statusBudge:
              return (
                <Badge
                  key={value}
                  type={data?.[value] ? "active" : "inactive"}
                  className={_class}
                />
              );

            case HeaderType.roleBudge:
              return (
                <Badge
                  key={value}
                  dot={false}
                  type="role"
                  title={data?.[value] || "N/A"}
                  className={_class}
                />
              );

            case HeaderType.tooltip:
              return (
                <TooltipForTags
                  key={value}
                  _class={_class}
                  data={data?.[value]}
                />
              );

            case HeaderType.longDesc:
              return (
                <LongDesc key={value} str={data?.[value]} _class={_class} />
              );

            case HeaderType.currencyType:
              return (
                <div
                  key={value}
                  className={cn(_class, "px-2 py-2 text-nowrap text-accent")}
                >
                  {data?.[value]}
                  {currency[data?.currencyType]}
                </div>
              );

            case HeaderType.checkbox:
              return (
                <CheckBox
                  key={value}
                  _class={_class}
                  checked={data?.[value]}
                  handleChecked={() => handleChecked(data?._id)}
                />
              );
            case HeaderType.flag:
              return (
                <div {...commonProps} key={value}>
                  {data?.[value] === prioriry.emergency ? (
                    <FlagIcon color="#FF0000" />
                  ) : data?.[value] === prioriry.vip ? (
                    <FlagIcon color="#d4af37" />
                  ) : (
                    <FlagIcon />
                  )}
                </div>
              );
            case HeaderType.iconText:
              return (
                <IconText key={value} text={data?.[value]} _class={_class} />
              );

            case HeaderType.colorBudge:
              return (
                <Badge key={value} type={data?.[value]} className={_class} />
              );
            case HeaderType.paymode: {
              const rawPayModes = data?.[value] || "";
              const counts = rawPayModes
                ?.split(",")
                ?.map((item) => item.trim().toLowerCase()) // normalize once
                ?.reduce((acc, key) => {
                  if (key != "") acc[key] = (acc[key] || 0) + 1;
                  return acc;
                }, {});
              return (
                <div
                  className={cn("flex flex-wrap gap-0.5", _class)}
                  key={value}
                >
                  {Object.entries(counts).map(([key, count]) => (
                    <Badge
                      key={key}
                      type={key}
                      title={`${key.toUpperCase()} (${count})`}
                      className="mr-1"
                      dot={false}
                    />
                  ))}
                </div>
              );
            }
            case HeaderType.tags:
              return (
                <div
                  key={value}
                  className={cn(
                    "flex gap-2 text-nowrap overflow-x-auto whitespace-nowrap scrollbar-hide",
                    _class
                  )}
                >
                  {data?.[value]?.length === 0 ? (
                    <span>No Tags</span>
                  ) : (
                    data?.[value]?.map((tag, index) => (
                      <Badge
                        key={index}
                        type={"tag"}
                        title={tag.name}
                        className="mr-1"
                        dot={false}
                      />
                    ))
                  )}
                </div>
              );
            case HeaderType.array:
              return (
                <div
                  key={value}
                  {...commonProps}
                  className={cn(
                    "flex gap-2 text-nowrap overflow-x-auto whitespace-nowrap scrollbar-hide",
                    _class
                  )}
                >
                  {data?.[value]?.length === 0 ? (
                    <span>NA </span>
                  ) : (
                    data?.[value]?.map((el, index) => (
                      <Badge
                        key={index}
                        type={"active"}
                        title={el}
                        className="mr-1"
                        dot={false}
                      />
                    ))
                  )}
                </div>
              );
            case HeaderType.link:
              return (
                <div key={value} className={cn("flex flex-wrap gap-2", _class)}>
                  <a
                    href={data?.[value]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {data?.[value]}
                  </a>
                </div>
              );
            case HeaderType.color: {
              const rgbToHex = (rgb) => {
                // Check if it's already a hex color
                if (rgb.startsWith("#")) return rgb.toUpperCase();

                // Extract RGB values from rgb(r, g, b) format
                const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (match) {
                  const r = parseInt(match[1]);
                  const g = parseInt(match[2]);
                  const b = parseInt(match[3]);
                  return `#${((1 << 24) + (r << 16) + (g << 8) + b)
                    .toString(16)
                    .slice(1)
                    .toUpperCase()}`;
                }
                return rgb; // Return as-is if format is unknown
              };

              const rawColor = data?.[value] || "#000000";
              const hexColor = rgbToHex(rawColor);

              return (
                <div
                  key={value}
                  className={cn("flex items-center gap-2", _class)}
                >
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: rawColor }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{hexColor}</span>
                  </div>
                </div>
              );
            }
            case HeaderType.switch: {
              // use the shared Toggle component. Expects column to provide onToggle(row, newValue)
              // Determine checked based on boolean or 'active'/'inactive' strings
              const raw = data?.[value];
              const isStringStatus = typeof raw === "string";
              const checked = isStringStatus
                ? String(raw).toLowerCase() === "active"
                : !!raw;

              const isToggling =
                Array.isArray(col?.togglingIds) &&
                col.togglingIds.includes(data?._id);

              // If column requests inactive rows to be non-interactive, compute disabled
              const inactiveDisabled =
                !!col?.disableInactive &&
                (isStringStatus
                  ? String(raw).toLowerCase() === "inactive"
                  : raw === false);
              const isDisabled = isToggling || inactiveDisabled;

              const handleChange = (e) => {
                e.stopPropagation();
                if (isDisabled) return;
                col?.onToggle && col.onToggle(data, !checked);
              };

              return (
                <div key={value} className={cn("flex items-center", _class)}>
                  <Toggle
                    isChecked={checked}
                    handleCheckboxChange={handleChange}
                    isDisabled={isDisabled}
                  />
                </div>
              );
            }
            case HeaderType.icon:
              // console.log("Rendering icon for", value, data);
              // console.log("Icon", data?.[value]);
              let iconSrc = null;
              const val = data?.[value];
              if (val) {
                iconSrc = getCleanImageUrl(val);
                console.log(`TableRow Icon URL for ${value}:`, iconSrc, 'Original:', val);
              }

              return (
                <div key={value} className={cn("flex items-center", _class)}>
                  {iconSrc ? (
                    <img
                      src={iconSrc}
                      alt="icon"
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <span className="text-gray-400">No Icon</span>
                  )}
                </div>
              );
            case HeaderType.dynamicAction:
              return (
                <div
                  key={value}
                  className={cn("flex items-center gap-3", _class)}
                >
                  {actions.map((action) => {
                    const isRowToggling =
                      (col?.togglingIds || [])?.includes(data?._id) || false;
                    return (
                      <div
                        aria-disabled={action.disabled || isRowToggling}
                        className={cn(
                          _class,
                          "flex items-center cursor-pointer whitespace-nowrap scrollbar-hide disabled:cursor-not-allowed",
                          (action.disabled || isRowToggling) &&
                            "opacity-50 pointer-events-none"
                        )}
                        key={action.label}
                        onClick={() => {
                          if (action.disabled || isRowToggling) return;
                          action.onClick(data);
                        }}
                      >
                        {action.icon}
                      </div>
                    );
                  })}
                </div>
              );

            case HeaderType.actionWithSubMenu: {
              const rowActions = col?.options?.map((action) => ({
                ...action,
                onClick: () => action.onClick(data), // inject current row (data)
              }));
              return (
                <div className="flex items-center gap-2" key={value}>
                  <ActionDropdown
                    actions={rowActions}
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                  >
                    <Button
                      variant="light"
                      className="rounded-md focus:ring-0 hover:border-accent/50 duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen((open) => !open);
                      }}
                    >
                      {/* <ThreeDotIcon/> */}
                      Actions
                    </Button>
                  </ActionDropdown>
                </div>
              );
            }

            default:
              return (
                <div {...commonProps} key={value}>
                  {data?.[value]}
                </div>
              );
          }
        })}
      </div>
    </>
  );
};

export default TableRow;
