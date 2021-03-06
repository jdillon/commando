#
# Project commands
#

function __project_module {
  require_module maven.sh

  #
  # rebuild
  #

  help_define_description rebuild 'Rebuild project'

  declare -g rebuild_options='clean install'

  function __rebuild_command {
    mvn ${rebuild_options} "$@"
  }

  define_command 'rebuild' __rebuild_command

  #
  # change-version
  #

  help_define_description change-version 'Change project version'
  help_define_syntax change-version '<version>'
  help_define_doc change-version '\
$(BOLD OPTIONS)

  -h,--help   Show usage

$(BOLD CONFIGURATION)

  $(UL change_version_artifacts)    Initial list of project artifact-ids to change; $(BOLD REQUIRED)
  $(UL change_version_properties)   Optional set of properties to change
'

  declare -g change_version_artifacts=
  declare -g change_version_properties=

  function __change_version_command {
    set +o nounset
    local newVersion="$1"
    set -o nounset

    if [ -z "$newVersion" ]; then
      die 'Missing required arguments'
    fi

    # see https://www.eclipse.org/tycho/sitedocs/tycho-release/tycho-versions-plugin/set-version-mojo.html
    mvn org.eclipse.tycho:tycho-versions-plugin:1.2.0:set-version \
      -Dartifacts=${change_version_artifacts} \
      -Dproperties=${change_version_properties} \
      -DnewVersion=${newVersion}
  }

  define_command 'change-version' __change_version_command

  #
  # license-headers
  #

  help_define_description license-headers 'Manage project license headers'
  help_define_syntax license-headers '<check|format>'
  help_define_doc license-headers '\
$(BOLD OPTIONS)

  -h,--help   Show usage

$(BOLD CONFIGURATION)

  $(UL license_check_options)   Options for license check
  $(UL license_format_options)  Options for license format

$(BOLD HOOKS)

  $(UL license_check)   Hook called to perform license check
  $(UL license_format)  Hook called to perform license format
'

  function __license_headers_command {
    set +o nounset
    local mode="$1"
    set -o nounset

    case ${mode} in
      check)
        license_check
        ;;

      format)
        license_format
        ;;

      *)
        die 'Missing or invalid mode'
        ;;
    esac
  }

  define_command 'license-headers' __license_headers_command

  declare -g license_check_options='--activate-profiles license-check --non-recursive'

  function license_check {
    mvn ${license_check_options} $*
  }

  declare -g license_format_options='--activate-profiles license-format --non-recursive'

  function license_format {
    mvn ${license_format_options} $*
  }
}

define_module __project_module "$@"
