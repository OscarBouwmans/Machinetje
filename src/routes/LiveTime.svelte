<script lang="ts">
    let { startDate, pauseTime } = $props<{
        startDate: Date,
        pauseTime: number,
    }>();

    let displayTime = $state<string>();

    $effect(() => {
        if (!startDate) {
            displayTime = format(pauseTime ?? 0);
            return;
        }

        let animFrame = requestAnimationFrame(loop);
        function loop() {
            displayTime = format(new Date().getTime() - startDate);
            animFrame = requestAnimationFrame(loop);
        };
        return () => cancelAnimationFrame(animFrame);
    });

    function format(time: number) {
        const date = new Date(time);
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        
        return new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            fractionalSecondDigits: 3,
        }).format(date);
    }
</script>

{displayTime}