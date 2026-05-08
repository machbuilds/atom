---
type: pattern
applies_to: [go, cli]
slug: cobra-silence-flags
---

# Set SilenceUsage and SilenceErrors on the root Cobra command

## Pattern

Always set `SilenceUsage: true` and `SilenceErrors: true` on the root
`cobra.Command`. Print errors yourself in `main()` after `Execute()`
returns.

## Why

By default, Cobra prints the full usage screen on **any** error from
a subcommand — including bugs in your own code. That's correct for
flag-parsing errors ("unknown flag --frobnicate") but disastrous for
runtime errors ("could not connect to database"), where dumping
80 lines of usage hides the actual error message.

`SilenceErrors` likewise stops Cobra from re-printing the error
message on top of whatever your code already logged, so users don't
see the same error twice in different formats.

## How to apply

```go
var rootCmd = &cobra.Command{
    Use:           "app",
    SilenceUsage:  true,
    SilenceErrors: true,
    // ...
}

func main() {
    if err := cmd.Execute(); err != nil {
        fmt.Fprintln(os.Stderr, err)
        os.Exit(1)
    }
}
```

This pattern means:
- Flag-parsing errors still print usage (Cobra handles them before
  RunE is called, regardless of SilenceUsage).
- Runtime errors from subcommand `RunE` print only what you write.
- Exit code is 1 on any error, 0 on success — predictable for
  shell pipelines.
