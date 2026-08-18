import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { handle } from "@/api/client";
import { threadCreate, threadUpdate } from "@/api/openapi-client/threads";
import { Thread, ThreadInitialProps, Visibility } from "@/api/openapi-schema";
import { NO_CATEGORY_VALUE } from "@/components/category/CategorySelect/useCategorySelect";
import { useSettings } from "@/lib/settings/settings-client";

export type Props = { editing?: string; initialDraft?: Thread };

export const FormShapeSchema = z.object({
  title: z.string(),
  body: z.string().min(1),
  category: z.string().optional(),
  tags: z.string().array().optional(),
  url: z.string().optional(),
});
export type FormShape = z.infer<typeof FormShapeSchema>;

export function useComposeForm({ initialDraft, editing }: Props) {
  const router = useRouter();
  const { settings } = useSettings();

  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const form = useForm<FormShape>({
    resolver: zodResolver(FormShapeSchema),
    reValidateMode: "onChange",
    defaultValues: initialDraft
      ? {
          title: initialDraft.title,
          body: initialDraft.body,
          tags: initialDraft.tags.map((t) => t.name),
          url: initialDraft.link?.url,
        }
      : {
          title: "",
          body: "",
        },
  });

  function validateCategory(category: string | undefined) {
    if (!settings?.require_thread_category || editing) return true;
    if (category && category !== NO_CATEGORY_VALUE) {
      form.clearErrors("category");
      return true;
    }

    form.setError("category", {
      message: "Choose a category before creating a thread.",
    });
    return false;
  }

  const saveDraft = async (data: FormShape) => {
    if (!validateCategory(data.category)) return;

    const payload: ThreadInitialProps = {
      ...data,

      // When saving a new draft, these are optional but must be explicitly set.
      title: data.title ?? "",
      body: data.body ?? "",
      url: data.url ?? "",
      tags: data.tags ?? [],
      category: data.category === NO_CATEGORY_VALUE ? undefined : data.category,

      visibility: Visibility.draft,
    };

    if (editing) {
      await threadUpdate(editing, payload);
    } else {
      const { id } = await threadCreate(payload);
      router.push(`/new?id=${id}`);
    }
  };

  const publish = async ({ title, body, category, tags, url }: FormShape) => {
    if (!validateCategory(category)) return;

    if (title.length < 1) {
      form.setError("title", {
        message: "Your post must have a title to be published",
      });
      return;
    }

    if (editing) {
      const { slug } = await threadUpdate(editing, {
        title,
        body,
        category: category === NO_CATEGORY_VALUE ? undefined : category,
        visibility: Visibility.published,
        tags,
        url,
      });
      router.push(`/t/${slug}`);
    } else {
      const { slug } = await threadCreate({
        title,
        body,
        category: category === NO_CATEGORY_VALUE ? undefined : category,
        visibility: Visibility.published,
        tags,
        url,
      });
      router.push(`/t/${slug}`);
    }
  };

  const handleSaveDraft = form.handleSubmit((data) => {
    if (!validateCategory(data.category)) return;

    return handle(
      async () => {
        setIsSavingDraft(true);
        await saveDraft(data);
      },
      {
        promiseToast: {
          loading: "Saving draft...",
          success: "Draft saved!",
        },
        cleanup: async () => {
          setIsSavingDraft(false);
        },
      },
    );
  });

  const handlePublish = form.handleSubmit((data) => {
    if (!validateCategory(data.category)) return;

    return handle(
      async () => {
        setIsPublishing(true);
        await publish(data);
      },
      {
        promiseToast: {
          loading: "Publishing post...",
          success: "Post published!",
        },
        cleanup: async () => {
          setIsPublishing(false);
        },
      },
    );
  });

  const handleAssetUpload = async () => {
    const state = form.getValues();
    if (!validateCategory(state.category)) return;

    await handle(
      async () => {
        setIsSavingDraft(true);
        await saveDraft(state);
      },
      {
        promiseToast: {
          loading: "Saving draft...",
          success: "Draft saved!",
        },
        cleanup: async () => {
          setIsSavingDraft(false);
        },
      },
    );
  };

  const handleAssetDelete = async () => {
    const state = form.getValues();
    if (!validateCategory(state.category)) return;

    await handle(
      async () => {
        setIsSavingDraft(true);
        await saveDraft(state);
      },
      {
        promiseToast: {
          loading: "Saving draft...",
          success: "Draft saved!",
        },
        cleanup: async () => {
          setIsSavingDraft(false);
        },
      },
    );
  };

  function handleBack() {
    router.back();
  }

  return {
    form,
    state: {
      isPublishing,
      isSavingDraft,
    },
    handlers: {
      handleSaveDraft,
      handlePublish,
      handleAssetDelete,
      handleAssetUpload,
      handleBack,
    },
  };
}
