import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/../tests/test-utils";
import CoordinationRedisTypeSelector from "./CoordinationRedisTypeSelector";
import { chooseSelectOption } from "../../../../../../tests/test-utils";

describe("CoordinationRedisTypeSelector", () => {
  it("labels the control and shows the current selection", () => {
    renderWithProviders(<CoordinationRedisTypeSelector redisType="node" onTypeChange={vi.fn()} />);

    expect(screen.getByText("Redis Type")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Node (Single Instance)")).toBeInTheDocument();
  });

  it("shows the description for the selected type", () => {
    renderWithProviders(<CoordinationRedisTypeSelector redisType="cluster" onTypeChange={vi.fn()} />);

    expect(screen.getByText("Redis Cluster mode for high availability and horizontal scaling")).toBeInTheDocument();
  });

  it("switches the description when the selected type changes", () => {
    const { rerender } = renderWithProviders(<CoordinationRedisTypeSelector redisType="node" onTypeChange={vi.fn()} />);
    expect(screen.getByText("Standard Redis node/single instance")).toBeInTheDocument();

    rerender(<CoordinationRedisTypeSelector redisType="sentinel" onTypeChange={vi.fn()} />);

    expect(screen.getByText("Redis Sentinel mode for high availability with automatic failover")).toBeInTheDocument();
    expect(screen.queryByText("Standard Redis node/single instance")).not.toBeInTheDocument();
  });

  it("reports the newly picked type to the caller", async () => {
    const onTypeChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<CoordinationRedisTypeSelector redisType="node" onTypeChange={onTypeChange} />);

    await chooseSelectOption(user, screen.getByRole("combobox"), "Cluster");

    expect(onTypeChange).toHaveBeenCalledTimes(1);
    expect(onTypeChange.mock.calls[0][0]).toBe("cluster");
  });

  it("offers every supported coordination redis type", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CoordinationRedisTypeSelector redisType="node" onTypeChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("Cluster")).toBeInTheDocument();
    expect(screen.getByText("Sentinel")).toBeInTheDocument();
    expect(screen.getAllByText("Node (Single Instance)").length).toBeGreaterThan(0);
  });
});
