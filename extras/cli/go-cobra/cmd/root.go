package cmd

import (
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "app",
	Short: "app — short one-line description",
	Long: `app does <something>.

Replace this long description with what your CLI actually does.
The shape of this scaffold (root + subcommands in cmd/, version
flag injected at link time) is the conventional Cobra layout.`,
	SilenceUsage:  true,
	SilenceErrors: true,
}

// SetVersion is called from main() with the version baked in by
// GoReleaser. Keeping the assignment here means cmd/ doesn't have
// to know about how the binary was built.
func SetVersion(v string) {
	rootCmd.Version = v
}

func Execute() error {
	return rootCmd.Execute()
}
